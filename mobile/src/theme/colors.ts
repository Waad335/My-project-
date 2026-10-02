// Dodana's colour palette, copied exactly from the website's
// tailwind.config.ts (a test fails if the two ever differ).
export const palette = {
  ivory: {
    DEFAULT: "#FBF5EF",
    50: "#FFFEFD",
    100: "#FBF5EF",
    200: "#F5EAE0",
    300: "#EEDDCD",
  },
  blush: {
    DEFAULT: "#DB9A96",
    50: "#FBF0EF",
    100: "#F5DEDC",
    200: "#EBBFBB",
    300: "#DB9A96",
    400: "#CB7B76",
    500: "#B85E58",
    600: "#984943",
  },
  mocha: {
    DEFAULT: "#3A2620",
    50: "#F4EEEC",
    100: "#E2D2CC",
    300: "#A3897D",
    400: "#6B4A3D",
    500: "#5D3F34",
    600: "#4F352B",
    700: "#3A2620",
    800: "#2A1B17",
    900: "#1C1210",
  },
  gold: {
    DEFAULT: "#C79A5E",
    50: "#FAF4EA",
    100: "#F0E1C4",
    200: "#E6CDA3",
    300: "#DBB984",
    400: "#C79A5E",
    500: "#AD7F45",
    600: "#8C6636",
    700: "#6F5029",
    800: "#523B1E",
  },
  champagne: {
    DEFAULT: "#E8D5B5",
    100: "#F7EFE3",
    200: "#F0E2CC",
    300: "#E8D5B5",
  },
  sand: {
    DEFAULT: "#EFE3D6",
    100: "#F7F0E8",
    200: "#EFE3D6",
    300: "#E4D2C0",
  },
} as const;

// What the app's components use. Mirrors how the website applies the
// palette: mocha text on ivory, mocha-700 primary actions, sand surfaces,
// blush accents and gold highlights.
export const colors = {
  background: palette.ivory[100],
  surface: palette.ivory[50],
  surfaceMuted: palette.sand[100],
  border: palette.sand[300],
  borderStrong: palette.mocha[700],

  text: palette.mocha[700],
  textStrong: palette.mocha[800],
  textMuted: palette.mocha[400],
  textSubtle: palette.mocha[300],
  textInverse: palette.ivory[100],

  primary: palette.mocha[700],
  primaryPressed: palette.mocha[800],
  onPrimary: palette.ivory[100],

  accent: palette.blush[300],
  accentStrong: palette.blush[500],
  accentSoft: palette.blush[50],
  highlight: palette.gold[400],
  highlightText: palette.gold[600],

  danger: palette.blush[600],
  dangerSoft: palette.blush[50],

  skeleton: palette.sand[200],
  overlay: "rgba(28, 18, 16, 0.4)",
} as const;

export type ColorName = keyof typeof colors;
