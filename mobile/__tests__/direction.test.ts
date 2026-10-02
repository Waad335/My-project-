import AsyncStorage from "@react-native-async-storage/async-storage";
import { applyLayoutDirection, layoutDirectionMatches } from "@/i18n/direction";

const mockReload = jest.fn(async () => undefined);
jest.mock("expo", () => ({ reloadAppAsync: (...args: unknown[]) => mockReload(...(args as [])) }));

const mockRn = { isRTL: false, allowRTL: jest.fn(), forceRTL: jest.fn() };
jest.mock("react-native", () => ({
  Platform: { OS: "ios" },
  I18nManager: {
    get isRTL() {
      return mockRn.isRTL;
    },
    allowRTL: (v: boolean) => mockRn.allowRTL(v),
    forceRTL: (v: boolean) => mockRn.forceRTL(v),
  },
}));

beforeEach(async () => {
  mockRn.isRTL = false;
  mockRn.allowRTL.mockClear();
  mockRn.forceRTL.mockClear();
  mockReload.mockClear();
  await AsyncStorage.clear();
});

describe("layout direction", () => {
  it("does nothing more when the direction already matches", async () => {
    expect(layoutDirectionMatches("en")).toBe(true);
    expect(await applyLayoutDirection("en")).toBe(false);
    expect(mockRn.forceRTL).toHaveBeenCalledWith(false);
    expect(mockRn.allowRTL).toHaveBeenCalledWith(false);
    expect(mockReload).not.toHaveBeenCalled();
  });

  it("switches to right-to-left for Arabic with one restart", async () => {
    expect(layoutDirectionMatches("ar")).toBe(false);
    expect(await applyLayoutDirection("ar")).toBe(true);
    expect(mockRn.allowRTL).toHaveBeenCalledWith(true);
    expect(mockRn.forceRTL).toHaveBeenCalledWith(true);
    expect(mockReload).toHaveBeenCalledTimes(1);
  });

  it("never restarts in a loop if the device doesn't switch", async () => {
    await applyLayoutDirection("ar");
    // After the restart the direction still hasn't changed:
    expect(await applyLayoutDirection("ar")).toBe(false);
    expect(mockReload).toHaveBeenCalledTimes(1);
  });

  it("keeps English left-to-right on an Arabic-language phone", async () => {
    mockRn.isRTL = true; // the phone's own language is right-to-left
    expect(await applyLayoutDirection("en")).toBe(true);
    expect(mockRn.allowRTL).toHaveBeenCalledWith(false);
    expect(mockRn.forceRTL).toHaveBeenCalledWith(false);
  });
});
