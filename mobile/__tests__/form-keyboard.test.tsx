import { Keyboard, Platform } from "react-native";
import { render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthShell } from "@/components/auth/AuthShell";
import { keyboardOverlap, scrollToReveal } from "@/components/auth/form-keyboard";
import { I18nProvider } from "@/i18n/I18nProvider";
import { formatNumber, numberLocale } from "@/i18n/format";
import { useLocaleStore } from "@/i18n/locale-store";

describe("keeping a field above the keyboard", () => {
  it("measures how much of the form the keyboard covers", () => {
    // Form ends at 800, keyboard starts at 500: 300 covered.
    expect(keyboardOverlap(800, 500)).toBe(300);
    // Android already resized the window: nothing covered.
    expect(keyboardOverlap(500, 500)).toBe(0);
    expect(keyboardOverlap(480, 500)).toBe(0);
  });

  it("scrolls just enough to show the field and the button below it", () => {
    // 400 visible above the keyboard; field at 600–650, button until 720.
    expect(scrollToReveal({ top: 600, bottom: 720, offset: 0, visibleHeight: 400, margin: 32 })).toBe(352);
    // Already visible: stays put.
    expect(scrollToReveal({ top: 100, bottom: 150, offset: 0, visibleHeight: 400, margin: 32 })).toBeNull();
    // Above the visible part (scrolling back to an error at the top).
    expect(scrollToReveal({ top: 40, bottom: 90, offset: 300, visibleHeight: 400, margin: 32 })).toBe(8);
    // Taller than what's visible: the field's top wins.
    expect(scrollToReveal({ top: 600, bottom: 1200, offset: 0, visibleHeight: 400, margin: 32 })).toBe(568);
  });

  it("listens for the keyboard on both platforms and stops when the form closes", async () => {
    const remove = jest.fn();
    const listen = jest.spyOn(Keyboard, "addListener").mockReturnValue({ remove } as never);
    useLocaleStore.setState({ locale: "en", hydrated: true });
    const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
    const view = await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <I18nProvider>
          <AuthShell title="Sign in">{null}</AuthShell>
        </I18nProvider>
      </SafeAreaProvider>
    );
    const events = listen.mock.calls.map(([name]) => name);
    expect(events).toEqual(Platform.OS === "ios" ? ["keyboardWillShow", "keyboardWillHide"] : ["keyboardDidShow", "keyboardDidHide"]);
    await view.unmount();
    expect(remove).toHaveBeenCalledTimes(2);
    listen.mockRestore();
  });
});

describe("number formatting", () => {
  it("uses the website's price digits everywhere: Arabic-Indic in Arabic", () => {
    expect(numberLocale("ar")).toBe("ar-EG");
    expect(formatNumber(12, "ar")).toBe("١٢");
    expect(formatNumber(4.5, "ar", { minimumFractionDigits: 1, maximumFractionDigits: 1 })).toBe("٤٫٥");
    expect(formatNumber(12, "en")).toBe("12");
  });
});
