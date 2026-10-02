import type { TextStyle } from "react-native";
import { Fraunces_500Medium } from "@expo-google-fonts/fraunces/500Medium";
import { Fraunces_600SemiBold } from "@expo-google-fonts/fraunces/600SemiBold";
import { DMSans_400Regular } from "@expo-google-fonts/dm-sans/400Regular";
import { DMSans_500Medium } from "@expo-google-fonts/dm-sans/500Medium";
import { DMSans_600SemiBold } from "@expo-google-fonts/dm-sans/600SemiBold";
import { Cairo_400Regular } from "@expo-google-fonts/cairo/400Regular";
import { Cairo_600SemiBold } from "@expo-google-fonts/cairo/600SemiBold";
import { Cairo_700Bold } from "@expo-google-fonts/cairo/700Bold";
import type { Locale } from "@/i18n/config";

// The website's three typefaces, bundled with the app (no download at run
// time): Fraunces for headings, DM Sans for English text and Cairo for all
// Arabic text. Only the weights the app uses are included.
export const fontAssets = {
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  Cairo_400Regular,
  Cairo_600SemiBold,
  Cairo_700Bold,
} as const;

type FontName = keyof typeof fontAssets;

export type TextVariant =
  | "display"
  | "title"
  | "heading"
  | "subheading"
  | "body"
  | "bodyStrong"
  | "caption"
  | "label"
  | "button";

type VariantSpec = { latin: FontName; arabic: FontName; size: number; lineHeight: number; letterSpacing?: number };

// Arabic glyphs are taller, so Arabic lines get extra height.
const ARABIC_LINE_HEIGHT = 1.15;

const variants: Record<TextVariant, VariantSpec> = {
  display: { latin: "Fraunces_600SemiBold", arabic: "Cairo_700Bold", size: 34, lineHeight: 40 },
  title: { latin: "Fraunces_600SemiBold", arabic: "Cairo_700Bold", size: 26, lineHeight: 32 },
  heading: { latin: "Fraunces_500Medium", arabic: "Cairo_700Bold", size: 20, lineHeight: 26 },
  subheading: { latin: "DMSans_600SemiBold", arabic: "Cairo_600SemiBold", size: 16, lineHeight: 22 },
  body: { latin: "DMSans_400Regular", arabic: "Cairo_400Regular", size: 15, lineHeight: 22 },
  bodyStrong: { latin: "DMSans_600SemiBold", arabic: "Cairo_600SemiBold", size: 15, lineHeight: 22 },
  caption: { latin: "DMSans_400Regular", arabic: "Cairo_400Regular", size: 13, lineHeight: 18 },
  label: { latin: "DMSans_500Medium", arabic: "Cairo_600SemiBold", size: 12, lineHeight: 16, letterSpacing: 0.6 },
  button: { latin: "DMSans_600SemiBold", arabic: "Cairo_600SemiBold", size: 15, lineHeight: 20 },
};

export function textStyle(variant: TextVariant, locale: Locale): TextStyle {
  const spec = variants[variant];
  if (locale === "ar") {
    // Arabic script is never letter-spaced.
    return {
      fontFamily: spec.arabic,
      fontSize: spec.size,
      lineHeight: Math.round(spec.lineHeight * ARABIC_LINE_HEIGHT),
    };
  }
  return {
    fontFamily: spec.latin,
    fontSize: spec.size,
    lineHeight: spec.lineHeight,
    ...(spec.letterSpacing ? { letterSpacing: spec.letterSpacing } : {}),
  };
}

// The DODANA wordmark is always set in Fraunces, in either language.
export const wordmarkStyle: TextStyle = {
  fontFamily: "Fraunces_600SemiBold",
  letterSpacing: 4,
};
