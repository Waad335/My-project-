import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, render, waitFor } from "@testing-library/react-native";
import type { MobileCustomer } from "@shared/api-types";
import { ApiError } from "@/api/errors";
import { useSessionStore } from "@/auth/session-store";
import { signOutCustomer, SYNC_PENDING_KEY, SYNCED_ACCOUNT_KEY, useAccountSync } from "@/shopping/account-sync";
import { useCartStore, type CartItem } from "@/shopping/cart-store";
import { useWishlistStore, type WishlistItem } from "@/shopping/wishlist-store";

// The API and the Keychain are replaced; the stores, the session and the
// sync logic are the real app code.
const mockApi = {
  getCart: jest.fn(),
  getWishlist: jest.fn(),
  saveCart: jest.fn(),
  saveWishlist: jest.fn(),
  getMe: jest.fn(),
};
jest.mock("@/api", () => ({
  get api() {
    return mockApi;
  },
  ApiError: jest.requireActual("@/api/errors").ApiError,
  setUnauthorizedHandler: jest.fn(),
}));
jest.mock("@/auth/token-storage", () => ({
  getToken: jest.fn(async () => null),
  saveToken: jest.fn(async () => undefined),
  clearToken: jest.fn(async () => undefined),
}));

const line = (productId: string, quantity = 1, maxStock = 9): CartItem => ({
  productId,
  variantId: null,
  slug: productId,
  nameEn: productId,
  nameAr: productId,
  image: null,
  unitPrice: 100,
  quantity,
  variantLabel: null,
  maxStock,
});
const piece = (productId: string): WishlistItem => ({ productId, slug: productId, nameEn: productId, nameAr: productId, image: null, price: 100 });
const customer: MobileCustomer = { id: "c1", email: "nour@example.test", name: "Nour", phone: null, createdAt: "2026-09-01T00:00:00.000Z" };

function Harness() {
  useAccountSync();
  return null;
}

const signIn = () => act(() => useSessionStore.setState({ status: "signedIn", customer, verified: true }));

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  useSessionStore.setState({ status: "guest", customer: null, verified: false });
  useCartStore.setState({ items: [] });
  useWishlistStore.setState({ items: [] });
  mockApi.saveCart.mockResolvedValue({ cart: [] });
  mockApi.saveWishlist.mockResolvedValue({ wishlist: [] });
});

describe("account sync", () => {
  it("leaves guests on the phone only: no account calls", async () => {
    await render(<Harness />);
    useCartStore.getState().addItem(line("p1"));
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
    expect(mockApi.getCart).not.toHaveBeenCalled();
    expect(mockApi.saveCart).not.toHaveBeenCalled();
  });

  it("merges the phone's cart and wishlist into the account on the first sync, then saves them", async () => {
    useCartStore.setState({ items: [line("shared", 3), line("phone-only")] });
    useWishlistStore.setState({ items: [piece("phone-heart")] });
    mockApi.getCart.mockResolvedValue({ cart: [line("shared", 1, 2), line("saved-only")] });
    mockApi.getWishlist.mockResolvedValue({ wishlist: [piece("saved-heart")] });

    await render(<Harness />);
    await signIn();

    await waitFor(() => expect(mockApi.saveCart).toHaveBeenCalled());
    expect(useCartStore.getState().items.map((i) => [i.productId, i.quantity])).toEqual([
      ["shared", 2],
      ["saved-only", 1],
      ["phone-only", 1],
    ]);
    expect(mockApi.saveCart).toHaveBeenCalledWith([
      { productId: "shared", variantId: null, quantity: 2 },
      { productId: "saved-only", variantId: null, quantity: 1 },
      { productId: "phone-only", variantId: null, quantity: 1 },
    ]);
    expect(mockApi.saveWishlist).toHaveBeenCalledWith(["saved-heart", "phone-heart"]);
    await waitFor(async () => expect(await AsyncStorage.getItem(SYNCED_ACCOUNT_KEY)).toBe("c1"));
  });

  it("afterwards takes the saved copy, and saves each change shortly after it happens", async () => {
    await AsyncStorage.setItem(SYNCED_ACCOUNT_KEY, "c1");
    useCartStore.setState({ items: [line("stale")] });
    mockApi.getCart.mockResolvedValue({ cart: [line("from-account", 2)] });
    mockApi.getWishlist.mockResolvedValue({ wishlist: [] });

    await render(<Harness />);
    await signIn();
    await waitFor(() => expect(useCartStore.getState().items.map((i) => i.productId)).toEqual(["from-account"]));
    expect(mockApi.saveCart).not.toHaveBeenCalled();

    await act(async () => {
      useCartStore.getState().addItem(line("new-piece"));
      useCartStore.getState().updateQuantity("from-account", null, 3);
    });
    await waitFor(() => expect(mockApi.saveCart).toHaveBeenCalledTimes(1), { timeout: 2000 });
    expect(mockApi.saveCart).toHaveBeenCalledWith([
      { productId: "from-account", variantId: null, quantity: 3 },
      { productId: "new-piece", variantId: null, quantity: 1 },
    ]);
  });

  it("keeps the phone's copy when the account can't be reached", async () => {
    useCartStore.setState({ items: [line("p1", 2)] });
    mockApi.getCart.mockRejectedValue(new ApiError({ status: 0, code: "network" }));
    mockApi.getWishlist.mockResolvedValue({ wishlist: [] });

    await render(<Harness />);
    await signIn();
    await waitFor(() => expect(mockApi.getCart).toHaveBeenCalled());
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
    expect(useCartStore.getState().items.map((i) => [i.productId, i.quantity])).toEqual([["p1", 2]]);
    expect(mockApi.saveCart).not.toHaveBeenCalled();
  });

  it("on sign-out saves the latest change to the account first, then clears the phone", async () => {
    await AsyncStorage.setItem(SYNCED_ACCOUNT_KEY, "c1");
    mockApi.getCart.mockResolvedValue({ cart: [line("p1")] });
    mockApi.getWishlist.mockResolvedValue({ wishlist: [piece("p1")] });

    await render(<Harness />);
    await signIn();
    await waitFor(() => expect(useCartStore.getState().items).toHaveLength(1));

    // A change made just before signing out, still waiting for its save.
    await act(async () => {
      useCartStore.getState().addItem(line("last-minute"));
    });
    let result: { keptOnPhone: boolean } | undefined;
    await act(async () => {
      result = await signOutCustomer();
    });
    expect(result).toEqual({ keptOnPhone: false });
    expect(mockApi.saveCart).toHaveBeenCalledWith([
      { productId: "p1", variantId: null, quantity: 1 },
      { productId: "last-minute", variantId: null, quantity: 1 },
    ]);
    expect(useSessionStore.getState()).toMatchObject({ status: "guest", ended: "signedOut" });
    expect(useCartStore.getState().items).toEqual([]);
    expect(useWishlistStore.getState().items).toEqual([]);
    expect(await AsyncStorage.getItem(SYNCED_ACCOUNT_KEY)).toBeNull();
    // Clearing the phone never reaches the account.
    const calls = mockApi.saveCart.mock.calls.length;
    await act(() => new Promise((resolve) => setTimeout(resolve, 1000)));
    expect(mockApi.saveCart).toHaveBeenCalledTimes(calls);
  });

  it("keeps the items on the phone when the account was never reached, and never overwrites it", async () => {
    useCartStore.setState({ items: [line("guest-piece")] });
    mockApi.getCart.mockRejectedValue(new ApiError({ status: 0, code: "network" }));
    mockApi.getWishlist.mockRejectedValue(new ApiError({ status: 0, code: "network" }));

    await render(<Harness />);
    await signIn();
    await waitFor(() => expect(mockApi.getCart).toHaveBeenCalled());
    let result: { keptOnPhone: boolean } | undefined;
    await act(async () => {
      result = await signOutCustomer();
    });
    expect(result).toEqual({ keptOnPhone: true });
    expect(mockApi.saveCart).not.toHaveBeenCalled();
    expect(useCartStore.getState().items.map((i) => i.productId)).toEqual(["guest-piece"]);
  });

  it("keeps the items on the phone when the last save fails at sign-out", async () => {
    await AsyncStorage.setItem(SYNCED_ACCOUNT_KEY, "c1");
    mockApi.getCart.mockResolvedValue({ cart: [line("p1")] });
    mockApi.getWishlist.mockResolvedValue({ wishlist: [] });
    await render(<Harness />);
    await signIn();
    await waitFor(() => expect(useCartStore.getState().items).toHaveLength(1));

    mockApi.saveCart.mockRejectedValue(new ApiError({ status: 0, code: "network" }));
    let result: { keptOnPhone: boolean } | undefined;
    await act(async () => {
      result = await signOutCustomer();
    });
    expect(result).toEqual({ keptOnPhone: true });
    expect(useCartStore.getState().items.map((i) => i.productId)).toEqual(["p1"]);
    expect(useSessionStore.getState().status).toBe("guest");
  });

  it("keeps the items on the phone when the session expires, and merges them at the next sign-in", async () => {
    await AsyncStorage.setItem(SYNCED_ACCOUNT_KEY, "c1");
    mockApi.getCart.mockResolvedValue({ cart: [line("p1")] });
    mockApi.getWishlist.mockResolvedValue({ wishlist: [] });
    await render(<Harness />);
    await signIn();
    await waitFor(() => expect(useCartStore.getState().items).toHaveLength(1));

    await act(() => useSessionStore.getState().signOut("expired"));
    expect(useCartStore.getState().items.map((i) => i.productId)).toEqual(["p1"]);
    await waitFor(async () => expect(await AsyncStorage.getItem(SYNCED_ACCOUNT_KEY)).toBeNull());

    // Signing in again merges (the marker was cleared), so nothing is replaced.
    await act(async () => {
      useCartStore.getState().addItem(line("added-while-signed-out"));
    });
    mockApi.getCart.mockResolvedValue({ cart: [line("p1")] });
    await signIn();
    await waitFor(() =>
      expect(useCartStore.getState().items.map((i) => i.productId)).toEqual(["p1", "added-while-signed-out"])
    );
  });

  it("merges instead of replacing at start-up when a save never reached the account", async () => {
    await AsyncStorage.setItem(SYNCED_ACCOUNT_KEY, "c1");
    await AsyncStorage.setItem(SYNC_PENDING_KEY, "c1");
    useCartStore.setState({ items: [line("unsaved-offline-change")] });
    mockApi.getCart.mockResolvedValue({ cart: [line("from-account")] });
    mockApi.getWishlist.mockResolvedValue({ wishlist: [] });

    await render(<Harness />);
    await signIn();
    await waitFor(() =>
      expect(useCartStore.getState().items.map((i) => i.productId)).toEqual(["from-account", "unsaved-offline-change"])
    );
    await waitFor(() => expect(mockApi.saveCart).toHaveBeenCalled());
    await waitFor(async () => expect(await AsyncStorage.getItem(SYNC_PENDING_KEY)).toBeNull());
  });

  it("marks a change as pending until the account confirms it", async () => {
    await AsyncStorage.setItem(SYNCED_ACCOUNT_KEY, "c1");
    mockApi.getCart.mockResolvedValue({ cart: [] });
    mockApi.getWishlist.mockResolvedValue({ wishlist: [] });
    await render(<Harness />);
    await signIn();
    await waitFor(() => expect(mockApi.getWishlist).toHaveBeenCalled());
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)));

    mockApi.saveCart.mockRejectedValueOnce(new ApiError({ status: 0, code: "network" }));
    await act(async () => {
      useCartStore.getState().addItem(line("p1"));
    });
    await waitFor(async () => expect(await AsyncStorage.getItem(SYNC_PENDING_KEY)).toBe("c1"));
    await waitFor(() => expect(mockApi.saveCart).toHaveBeenCalledTimes(1), { timeout: 2000 });
    // The save failed: still pending.
    expect(await AsyncStorage.getItem(SYNC_PENDING_KEY)).toBe("c1");

    await act(async () => {
      useCartStore.getState().updateQuantity("p1", null, 2);
    });
    await waitFor(() => expect(mockApi.saveCart).toHaveBeenCalledTimes(2), { timeout: 2000 });
    await waitFor(async () => expect(await AsyncStorage.getItem(SYNC_PENDING_KEY)).toBeNull());
  });
});
