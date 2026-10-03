import { ApiError } from "@/api/errors";
import { useSessionStore } from "@/auth/session-store";

const mockTokenState = { token: null as string | null, status: "none" as "none" | "valid" | "expired" };
jest.mock("@/auth/token-storage", () => ({
  getToken: jest.fn(async () => mockTokenState.token),
  getTokenStatus: jest.fn(async () => mockTokenState.status),
  saveToken: jest.fn(async ({ token }: { token: string }) => {
    mockTokenState.token = token;
    mockTokenState.status = "valid";
  }),
  clearToken: jest.fn(async () => {
    mockTokenState.token = null;
    mockTokenState.status = "none";
  }),
}));

const mockGetMe = jest.fn();
jest.mock("@/api", () => {
  const actual = jest.requireActual("@/api/errors");
  return {
    api: { getMe: (...args: unknown[]) => mockGetMe(...args) },
    ApiError: actual.ApiError,
    setUnauthorizedHandler: jest.fn(),
  };
});

const customer = { id: "u1", email: "nour@example.test", name: "Nour", phone: null, createdAt: "2026-01-01T00:00:00.000Z" };
const withToken = (token: string) => {
  mockTokenState.token = token;
  mockTokenState.status = "valid";
};

beforeEach(() => {
  mockTokenState.token = null;
  mockTokenState.status = "none";
  mockGetMe.mockReset();
  useSessionStore.setState({ status: "unknown", customer: null, verified: false, ended: null });
});

describe("session", () => {
  it("is a guest without a token, and doesn't call the server", async () => {
    await useSessionStore.getState().hydrate();
    expect(useSessionStore.getState()).toMatchObject({ status: "guest", ended: null });
    expect(mockGetMe).not.toHaveBeenCalled();
  });

  it("confirms a stored token with the server", async () => {
    withToken("t");
    mockGetMe.mockResolvedValue({ customer });
    await useSessionStore.getState().hydrate();
    expect(useSessionStore.getState()).toMatchObject({ status: "signedIn", customer, verified: true });
  });

  it("says the session expired when the stored token has run out, without calling the server", async () => {
    mockTokenState.status = "expired";
    await useSessionStore.getState().hydrate();
    expect(useSessionStore.getState()).toMatchObject({ status: "guest", ended: "expired" });
    expect(mockGetMe).not.toHaveBeenCalled();
  });

  it("signs out, as expired, when the server rejects the token", async () => {
    withToken("revoked");
    mockGetMe.mockRejectedValue(new ApiError({ status: 401, code: "unauthorized" }));
    await useSessionStore.getState().hydrate();
    expect(useSessionStore.getState()).toMatchObject({ status: "guest", ended: "expired" });
    expect(mockTokenState.token).toBeNull();
  });

  it("keeps the token when offline at start-up, then confirms it later", async () => {
    withToken("t");
    mockGetMe.mockRejectedValue(new ApiError({ status: 0, code: "network" }));
    await useSessionStore.getState().hydrate();
    expect(useSessionStore.getState()).toMatchObject({ status: "signedIn", customer: null, verified: false });
    expect(mockTokenState.token).toBe("t");

    mockGetMe.mockResolvedValue({ customer });
    await useSessionStore.getState().revalidate();
    expect(useSessionStore.getState()).toMatchObject({ status: "signedIn", customer, verified: true });
  });

  it("notices a token that ran out while the app was open", async () => {
    useSessionStore.setState({ status: "signedIn", customer, verified: true });
    mockTokenState.token = null; // getToken drops an expired token
    await useSessionStore.getState().revalidate();
    expect(useSessionStore.getState()).toMatchObject({ status: "guest", ended: "expired" });
  });

  it("signs in and out, remembering why the session ended", async () => {
    useSessionStore.setState({ ended: "expired" });
    await useSessionStore.getState().signIn({ token: "new", tokenType: "Bearer", expiresAt: "2099-01-01T00:00:00.000Z", customer });
    expect(useSessionStore.getState()).toMatchObject({ status: "signedIn", customer, ended: null });
    expect(mockTokenState.token).toBe("new");
    await useSessionStore.getState().signOut();
    expect(useSessionStore.getState()).toMatchObject({ status: "guest", customer: null, ended: "signedOut" });
    expect(mockTokenState.token).toBeNull();
  });

  it("treats a rejected token as an expired session only while signed in", async () => {
    // The handler the session registered with the API client at start-up.
    const { setUnauthorizedHandler } = jest.requireMock("@/api") as { setUnauthorizedHandler: jest.Mock };
    const mockHandler = { current: setUnauthorizedHandler.mock.calls[0]?.[0] as (() => void) | undefined };
    expect(mockHandler.current).toBeInstanceOf(Function);
    useSessionStore.setState({ status: "guest", ended: null });
    mockHandler.current?.();
    await Promise.resolve();
    expect(useSessionStore.getState().ended).toBeNull();

    useSessionStore.setState({ status: "signedIn", customer, verified: true });
    mockHandler.current?.();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(useSessionStore.getState()).toMatchObject({ status: "guest", ended: "expired" });
  });

  it("ignores a late rejection of an older token once the customer has signed in again", async () => {
    const { setUnauthorizedHandler } = jest.requireMock("@/api") as { setUnauthorizedHandler: jest.Mock };
    const handler = setUnauthorizedHandler.mock.calls[0]?.[0] as (rejectedToken: string | null) => void;
    const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
    withToken("new");
    useSessionStore.setState({ status: "signedIn", customer, verified: true });

    handler("old");
    await settle();
    expect(useSessionStore.getState()).toMatchObject({ status: "signedIn", ended: null });
    expect(mockTokenState.token).toBe("new");

    handler("new");
    await settle();
    expect(useSessionStore.getState()).toMatchObject({ status: "guest", ended: "expired" });
    expect(mockTokenState.token).toBeNull();
  });

  it("doesn't end a newer session when an older check is rejected", async () => {
    withToken("old");
    useSessionStore.setState({ status: "signedIn", customer: null, verified: false });
    mockGetMe.mockImplementation(async () => {
      // The customer signed in again while the old token was being checked.
      mockTokenState.token = "new";
      throw new ApiError({ status: 401, code: "unauthorized" });
    });
    await useSessionStore.getState().revalidate();
    expect(useSessionStore.getState()).toMatchObject({ status: "signedIn", ended: null });
    expect(mockTokenState.token).toBe("new");
  });
});
