import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Linking } from "react-native";
import type { ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AuthSessionResponse, MobileCustomer } from "@shared/api-types";
import { ApiError } from "@/api/errors";
import { useSessionStore } from "@/auth/session-store";
import { I18nProvider } from "@/i18n/I18nProvider";
import { useLocaleStore } from "@/i18n/locale-store";
import type { Locale } from "@/i18n/config";
import AccountScreen from "@/app/(tabs)/account";
import ForgotPasswordScreen from "@/app/auth/forgot-password";
import RegisterScreen from "@/app/auth/register";
import SignInScreen from "@/app/auth/sign-in";
import { useAccountSync } from "@/shopping/account-sync";
import { useCartStore, type CartItem } from "@/shopping/cart-store";
import { useWishlistStore } from "@/shopping/wishlist-store";
import { settings } from "./helpers/catalog-fixtures";

// Router, API and the Keychain are replaced; screens, forms, validation,
// session and sync are the real app code.
const mockRouter = { push: jest.fn(), navigate: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) };
jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
  Stack: { Screen: () => null },
}));

const mockApi = {
  login: jest.fn(),
  register: jest.fn(),
  forgotPassword: jest.fn(),
  getMe: jest.fn(),
  getSettings: jest.fn(),
  getCart: jest.fn(),
  getWishlist: jest.fn(),
  saveCart: jest.fn(),
  saveWishlist: jest.fn(),
};
jest.mock("@/api", () => ({
  get api() {
    return mockApi;
  },
  ApiError: jest.requireActual("@/api/errors").ApiError,
  setUnauthorizedHandler: jest.fn(),
}));

const mockSecure = { token: null as string | null };
jest.mock("@/auth/token-storage", () => ({
  getToken: jest.fn(async () => mockSecure.token),
  getTokenStatus: jest.fn(async () => (mockSecure.token ? "valid" : "none")),
  saveToken: jest.fn(async ({ token }: { token: string }) => {
    mockSecure.token = token;
  }),
  clearToken: jest.fn(async () => {
    mockSecure.token = null;
  }),
}));

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

async function renderIn(locale: Locale, ui: ReactNode) {
  useLocaleStore.setState({ locale, hydrated: true });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={client}>
        <I18nProvider>{ui}</I18nProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const customer: MobileCustomer = { id: "c1", email: "nour@example.test", name: "Nour", phone: null, createdAt: "2026-09-01T00:00:00.000Z" };
const SECRET_TOKEN = "header.payload.signature-not-for-storage";
const session: AuthSessionResponse = { token: SECRET_TOKEN, tokenType: "Bearer", expiresAt: "2099-01-01T00:00:00.000Z", customer };
const guestLine: CartItem = {
  productId: "guest-piece",
  variantId: null,
  slug: "guest-piece",
  nameEn: "Guest Piece",
  nameAr: "قطعة",
  image: null,
  unitPrice: 100,
  quantity: 2,
  variantLabel: null,
  maxStock: 9,
};

beforeEach(async () => {
  jest.clearAllMocks();
  mockRouter.canGoBack.mockReturnValue(true);
  mockSecure.token = null;
  await AsyncStorage.clear();
  useSessionStore.setState({ status: "guest", customer: null, verified: false, ended: null });
  useCartStore.setState({ items: [] });
  useWishlistStore.setState({ items: [] });
  mockApi.getSettings.mockResolvedValue(settings({ siteUrl: "https://dodana.example" }));
  mockApi.saveCart.mockResolvedValue({ cart: [] });
  mockApi.saveWishlist.mockResolvedValue({ wishlist: [] });
});

const fill = async (label: string, value: string) => fireEvent.changeText(screen.getByLabelText(label), value);

describe("sign in", () => {
  it("checks the form on the phone before sending anything", async () => {
    await renderIn("en", <SignInScreen />);
    await fireEvent.press(screen.getByRole("button", { name: "Sign In" }));
    expect(screen.getByText("Please enter a valid email address.")).toBeTruthy();
    expect(screen.getByText("Please enter your password.")).toBeTruthy();
    expect(mockApi.login).not.toHaveBeenCalled();
  });

  it("signs in, keeps the token only in the secure store, and goes back", async () => {
    mockApi.login.mockResolvedValue(session);
    await renderIn("en", <SignInScreen />);
    await fill("Email address", "  nour@example.test ");
    await fill("Password", "correct horse");
    await fireEvent.press(screen.getByRole("button", { name: "Sign In" }));
    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
    expect(mockApi.login).toHaveBeenCalledWith({ email: "nour@example.test", password: "correct horse" });
    expect(useSessionStore.getState()).toMatchObject({ status: "signedIn", customer, verified: true });
    expect(mockSecure.token).toBe(SECRET_TOKEN);
    const stored = JSON.stringify(await AsyncStorage.multiGet(await AsyncStorage.getAllKeys()));
    expect(stored).not.toContain(SECRET_TOKEN);
  });

  it("shows the server's message for a wrong password and stays signed out", async () => {
    mockApi.login.mockRejectedValue(
      new ApiError({ status: 401, code: "invalidCredentials", serverMessage: "That email and password don't match. Please try again." })
    );
    await renderIn("en", <SignInScreen />);
    await fill("Email address", "nour@example.test");
    await fill("Password", "wrong");
    await fireEvent.press(screen.getByRole("button", { name: "Sign In" }));
    expect(await screen.findByText("That email and password don't match. Please try again.")).toBeTruthy();
    expect(useSessionStore.getState().status).toBe("guest");
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it("shows that it is working, and explains a lost connection", async () => {
    let fail: (error: unknown) => void = () => undefined;
    mockApi.login.mockReturnValue(new Promise((_, reject) => (fail = reject)));
    await renderIn("en", <SignInScreen />);
    await fill("Email address", "nour@example.test");
    await fill("Password", "pw");
    // The request is held open, so the press is still in progress here.
    const pressing = fireEvent.press(screen.getByRole("button", { name: "Sign In" }));
    expect((await screen.findByRole("button", { name: "Signing in…" })).props.accessibilityState).toMatchObject({ busy: true });
    await act(async () => fail(new ApiError({ status: 0, code: "network" })));
    await pressing;
    expect(await screen.findByText("We couldn't connect. Check your internet connection and try again.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeTruthy();
  });

  it("tells the customer when their session has ended", async () => {
    useSessionStore.setState({ ended: "expired" });
    await renderIn("ar", <SignInScreen />);
    expect(screen.getByText("انتهت جلستك. سجّلي الدخول تاني من فضلك.")).toBeTruthy();
  });

  it("merges the guest's cart into the account after signing in", async () => {
    useCartStore.setState({ items: [guestLine] });
    useWishlistStore.setState({ items: [{ productId: "heart", slug: "heart", nameEn: "H", nameAr: "H", image: null, price: 1 }] });
    mockApi.login.mockResolvedValue(session);
    mockApi.getCart.mockResolvedValue({ cart: [{ ...guestLine, productId: "saved-before", slug: "saved-before", quantity: 1 }] });
    mockApi.getWishlist.mockResolvedValue({ wishlist: [] });
    function SyncHarness() {
      useAccountSync();
      return null;
    }
    await renderIn(
      "en",
      <>
        <SyncHarness />
        <SignInScreen />
      </>
    );
    await fill("Email address", "nour@example.test");
    await fill("Password", "pw");
    await fireEvent.press(screen.getByRole("button", { name: "Sign In" }));
    await waitFor(() => expect(mockApi.saveCart).toHaveBeenCalled());
    expect(mockApi.saveCart).toHaveBeenCalledWith([
      { productId: "saved-before", variantId: null, quantity: 1 },
      { productId: "guest-piece", variantId: null, quantity: 2 },
    ]);
    expect(mockApi.saveWishlist).toHaveBeenCalledWith(["heart"]);
    expect(useCartStore.getState().items.map((i) => i.productId)).toEqual(["saved-before", "guest-piece"]);
  });
});

describe("create account", () => {
  it("checks every field like the website, in Arabic too", async () => {
    await renderIn("ar", <RegisterScreen />);
    await fill("رقم الموبايل", "0123");
    await fireEvent.press(screen.getByRole("button", { name: "إنشاء حساب" }));
    const ar = jest.requireActual("../../src/messages/ar.json").account.errors;
    expect(screen.getByText(ar.nameTooShort)).toBeTruthy();
    expect(screen.getByText(ar.invalidEmail)).toBeTruthy();
    expect(screen.getByText(ar.invalidPhone)).toBeTruthy();
    expect(screen.getByText(ar.passwordTooShort)).toBeTruthy();
    expect(mockApi.register).not.toHaveBeenCalled();
  });

  it("creates the account with a normalised phone number and signs in", async () => {
    mockApi.register.mockResolvedValue(session);
    await renderIn("en", <RegisterScreen />);
    await fill("Full name", " Nour ");
    await fill("Email address", "nour@example.test");
    await fill("Mobile number", "٠١٠١٢٣٤٥٦٧٨");
    await fill("Password", "long enough");
    await fireEvent.press(screen.getByRole("button", { name: "Create Account" }));
    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
    expect(mockApi.register).toHaveBeenCalledWith({ name: "Nour", email: "nour@example.test", phone: "01012345678", password: "long enough" });
    expect(useSessionStore.getState().status).toBe("signedIn");
  });

  it("shows the server's field error under the email", async () => {
    mockApi.register.mockRejectedValue(new ApiError({ status: 409, code: "emailInUse", serverMessage: "x", fieldErrors: { email: "emailInUse" } }));
    await renderIn("en", <RegisterScreen />);
    await fill("Full name", "Nour");
    await fill("Email address", "nour@example.test");
    await fill("Password", "long enough");
    await fireEvent.press(screen.getByRole("button", { name: "Create Account" }));
    expect(await screen.findByText("An account with this email already exists. Try signing in.")).toBeTruthy();
    expect(useSessionStore.getState().status).toBe("guest");
  });

  it("opens the website's Terms and Privacy pages", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await renderIn("en", <RegisterScreen />);
    await fireEvent.press(await screen.findByRole("link", { name: "Terms" }));
    expect(open).toHaveBeenCalledWith("https://dodana.example/terms");
    await fireEvent.press(screen.getByRole("link", { name: "Privacy Policy" }));
    expect(open).toHaveBeenCalledWith("https://dodana.example/privacy");
    open.mockRestore();
  });
});

describe("forgot password", () => {
  it("sends the website's reset email and shows the server's confirmation", async () => {
    mockApi.forgotPassword.mockResolvedValue({ ok: true, code: "resetEmailSent", message: "If an account exists for that email, a reset link is on its way." });
    await renderIn("en", <ForgotPasswordScreen />);
    await fireEvent.press(screen.getByRole("button", { name: "Send Reset Link" }));
    expect(screen.getByText("Please enter a valid email address.")).toBeTruthy();
    await fill("Email address", "nour@example.test");
    await fireEvent.press(screen.getByRole("button", { name: "Send Reset Link" }));
    expect(await screen.findByText("If an account exists for that email, a reset link is on its way.")).toBeTruthy();
    expect(mockApi.forgotPassword).toHaveBeenCalledWith("nour@example.test");
  });
});

describe("account tab", () => {
  it("offers sign-in and account creation to guests", async () => {
    await renderIn("en", <AccountScreen />);
    await fireEvent.press(screen.getByRole("button", { name: "Sign In" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/auth/sign-in");
    await fireEvent.press(screen.getByRole("button", { name: "Create Account" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/auth/register");
  });

  it("shows who is signed in and signs out", async () => {
    mockSecure.token = SECRET_TOKEN;
    useSessionStore.setState({ status: "signedIn", customer, verified: true });
    await renderIn("en", <AccountScreen />);
    expect(screen.getByText("Hello, Nour")).toBeTruthy();
    expect(screen.getByText("nour@example.test")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(useSessionStore.getState().status).toBe("guest"));
    expect(mockSecure.token).toBeNull();
    expect(await screen.findByRole("button", { name: "Sign In" })).toBeTruthy();
  });

  it("says when the account couldn't be confirmed offline", async () => {
    useSessionStore.setState({ status: "signedIn", customer: null, verified: false });
    await renderIn("ar", <AccountScreen />);
    expect(screen.getByText("إنتي مسجّلة الدخول. هنأكد حسابك أول ما يرجع الإنترنت.")).toBeTruthy();
  });

  it("explains an expired session to the guest", async () => {
    useSessionStore.setState({ status: "guest", ended: "expired" });
    await renderIn("en", <AccountScreen />);
    expect(screen.getByText("Your session has ended. Please sign in again.")).toBeTruthy();
  });
});
