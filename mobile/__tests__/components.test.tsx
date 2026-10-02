import { fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { Heart } from "@/components/icons";
import { ApiError } from "@/api/errors";
import { AppText, Button, EmptyState, ErrorState, PriceTag } from "@/components/ui";
import { I18nProvider } from "@/i18n/I18nProvider";
import { useLocaleStore } from "@/i18n/locale-store";
import type { Locale } from "@/i18n/config";

async function inLocale(locale: Locale, ui: ReactNode) {
  useLocaleStore.setState({ locale, hydrated: true });
  return render(<I18nProvider>{ui}</I18nProvider>);
}

const flatStyle = (node: { props: { style?: unknown } }) =>
  Object.assign({}, ...([node.props.style].flat(Infinity).filter(Boolean) as object[]));

describe("design system", () => {
  it("sets English text in DM Sans/Fraunces and Arabic text in Cairo", async () => {
    await inLocale("en", <AppText variant="title">Title</AppText>);
    expect(flatStyle(screen.getByText("Title")).fontFamily).toBe("Fraunces_600SemiBold");
    await screen.unmount();
    await inLocale("ar", <AppText variant="title">عنوان</AppText>);
    expect(flatStyle(screen.getByText("عنوان")).fontFamily).toBe("Cairo_700Bold");
  });

  it("marks headings for screen readers", async () => {
    await inLocale("en", <AppText variant="heading">Heading</AppText>);
    expect(screen.getByRole("header")).toBeTruthy();
  });

  it("shows prices like the website, with the old price and discount", async () => {
    await inLocale("en", <PriceTag price={1250} oldPrice={1500} />);
    expect(screen.getByText("EGP 1,250")).toBeTruthy();
    expect(screen.getByText("EGP 1,500")).toBeTruthy();
    expect(screen.getByText("-17% OFF")).toBeTruthy();
    await screen.unmount();
    await inLocale("ar", <PriceTag price={1250} oldPrice={1500} />);
    expect(screen.getByText("١٬٢٥٠ ج.م")).toBeTruthy();
    expect(screen.getByText("-17% خصم")).toBeTruthy();
  });

  it("hides the old price when it isn't higher", async () => {
    await inLocale("en", <PriceTag price={1250} oldPrice={1000} />);
    expect(screen.queryByText("EGP 1,000")).toBeNull();
    expect(screen.queryByText(/OFF/)).toBeNull();
  });

  it("buttons are accessible and respect disabled/loading", async () => {
    const onPress = jest.fn();
    await inLocale("en", <Button label="Save" onPress={onPress} />);
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(onPress).toHaveBeenCalledTimes(1);
    await screen.unmount();

    const blocked = jest.fn();
    await inLocale("en", <Button label="Save" onPress={blocked} loading />);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.props.accessibilityState).toMatchObject({ disabled: true, busy: true });
    await fireEvent.press(button);
    expect(blocked).not.toHaveBeenCalled();
  });

  it("explains connection problems in the customer's language", async () => {
    await inLocale("ar", <ErrorState error={new ApiError({ status: 0, code: "network" })} onRetry={() => undefined} />);
    expect(screen.getByText("مقدرناش نتصل. اتأكدي من الإنترنت وحاولي تاني.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "حاولي تاني" })).toBeTruthy();
  });

  it("prefers the server's own (already translated) message", async () => {
    await inLocale("en", <ErrorState error={new ApiError({ status: 429, code: "tooManyAttempts", serverMessage: "Too many attempts." })} />);
    expect(screen.getByText("Too many attempts.")).toBeTruthy();
  });

  it("renders empty states", async () => {
    await inLocale("en", <EmptyState icon={Heart} title="Nothing yet" body="Saved pieces appear here." />);
    expect(screen.getByText("Nothing yet")).toBeTruthy();
    expect(screen.getByText("Saved pieces appear here.")).toBeTruthy();
  });
});
