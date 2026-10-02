import { ApiError } from "@/api/errors";
import { useSessionStore } from "@/auth/session-store";

const mockTokenState = { token: null as string | null };
jest.mock("@/auth/token-storage", () => ({
  getToken: jest.fn(async () => mockTokenState.token),
  saveToken: jest.fn(async ({ token }: { token: string }) => {
    mockTokenState.token = token;
  }),
  clearToken: jest.fn(async () => {
    mockTokenState.token = null;
  }),
}));

const mockGetMe = jest.fn();
jest.mock("@/api", () => {
  const actual = jest.requireActual("@/api/errors");
  return { api: { getMe: (...args: unknown[]) => mockGetMe(...args) }, ApiError: actual.ApiError, setUnauthorizedHandler: jest.fn() };
});

const customer = { id: "u1", email: "nour@example.test", name: "Nour", phone: null, createdAt: "2026-01-01T00:00:00.000Z" };

beforeEach(() => {
  mockTokenState.token = null;
  mockGetMe.mockReset();
  useSessionStore.setState({ status: "unknown", customer: null, verified: false });
});

describe("session", () => {
  it("is a guest without a token, and doesn't call the server", async () => {
    await useSessionStore.getState().hydrate();
    expect(useSessionStore.getState().status).toBe("guest");
    expect(mockGetMe).not.toHaveBeenCalled();
  });

  it("confirms a stored token with the server", async () => {
    mockTokenState.token = "t";
    mockGetMe.mockResolvedValue({ customer });
    await useSessionStore.getState().hydrate();
    expect(useSessionStore.getState()).toMatchObject({ status: "signedIn", customer, verified: true });
  });

  it("signs out when the server rejects the token", async () => {
    mockTokenState.token = "revoked";
    mockGetMe.mockRejectedValue(new ApiError({ status: 401, code: "unauthorized" }));
    await useSessionStore.getState().hydrate();
    expect(useSessionStore.getState().status).toBe("guest");
    expect(mockTokenState.token).toBeNull();
  });

  it("keeps the token when offline at start-up, marked unverified", async () => {
    mockTokenState.token = "t";
    mockGetMe.mockRejectedValue(new ApiError({ status: 0, code: "network" }));
    await useSessionStore.getState().hydrate();
    expect(useSessionStore.getState()).toMatchObject({ status: "signedIn", customer: null, verified: false });
    expect(mockTokenState.token).toBe("t");
  });

  it("signs in and out", async () => {
    await useSessionStore.getState().signIn({ token: "new", tokenType: "Bearer", expiresAt: "2099-01-01T00:00:00.000Z", customer });
    expect(useSessionStore.getState()).toMatchObject({ status: "signedIn", customer });
    expect(mockTokenState.token).toBe("new");
    await useSessionStore.getState().signOut();
    expect(useSessionStore.getState()).toMatchObject({ status: "guest", customer: null });
    expect(mockTokenState.token).toBeNull();
  });
});
