import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearToken, getToken, resetTokenCacheForTests, saveToken } from "@/auth/token-storage";

const mockSecureItems = new Map<string, string>();
const mockSecureCalls: { op: string; key: string; options: unknown }[] = [];

jest.mock("expo-secure-store", () => ({
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: "AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY",
  getItemAsync: jest.fn(async (key: string, options: unknown) => {
    mockSecureCalls.push({ op: "get", key, options });
    return mockSecureItems.get(key) ?? null;
  }),
  setItemAsync: jest.fn(async (key: string, value: string, options: unknown) => {
    mockSecureCalls.push({ op: "set", key, options });
    mockSecureItems.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string, options: unknown) => {
    mockSecureCalls.push({ op: "delete", key, options });
    mockSecureItems.delete(key);
  }),
}));

const future = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
const past = new Date(Date.now() - 1000).toISOString();

beforeEach(async () => {
  mockSecureItems.clear();
  mockSecureCalls.length = 0;
  resetTokenCacheForTests();
  await AsyncStorage.clear();
});

describe("token storage", () => {
  it("keeps the token in the secure store, readable only on this device", async () => {
    await saveToken({ token: "abc.def.ghi", expiresAt: future });
    resetTokenCacheForTests(); // as after an app restart
    expect(await getToken()).toBe("abc.def.ghi");
    for (const call of mockSecureCalls) {
      expect(call.options).toEqual({ keychainAccessible: "AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY" });
    }
  });

  it("never writes the token to ordinary app storage", async () => {
    await saveToken({ token: "abc.def.ghi", expiresAt: future });
    const keys = await AsyncStorage.getAllKeys();
    for (const key of keys) {
      expect(await AsyncStorage.getItem(key)).not.toContain("abc.def.ghi");
    }
  });

  it("drops an expired token", async () => {
    await saveToken({ token: "old.token.value", expiresAt: past });
    expect(await getToken()).toBeNull();
    expect(mockSecureItems.size).toBe(0);
  });

  it("treats an unreadable entry as signed out", async () => {
    mockSecureItems.set("dodana.session", "not json");
    expect(await getToken()).toBeNull();
  });

  it("clears the token on sign-out", async () => {
    await saveToken({ token: "abc.def.ghi", expiresAt: future });
    await clearToken();
    resetTokenCacheForTests();
    expect(await getToken()).toBeNull();
  });
});
