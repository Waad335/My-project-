import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
      },
      transitionTimingFunction: {
        luxe: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      fontFamily: {
        heading: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        arabic: ["var(--font-cairo)", "Tahoma", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
        card: "1.5rem",
      },
      boxShadow: {
        soft: "0 4px 24px -4px rgba(58, 38, 32, 0.08), 0 2px 8px -2px rgba(58, 38, 32, 0.06)",
        "soft-lg": "0 12px 40px -8px rgba(58, 38, 32, 0.14), 0 4px 16px -4px rgba(58, 38, 32, 0.08)",
        gold: "0 4px 20px -4px rgba(199, 154, 94, 0.35)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "heart-pop": {
          "0%": { transform: "scale(0.8)" },
          "50%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "scroll-cue": {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "30%": { opacity: "1" },
          "100%": { transform: "translateY(200%)", opacity: "0" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "loader-sweep": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(250%)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.04)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        "heart-pop": "heart-pop 0.3s ease-out",
        shimmer: "shimmer 2.5s linear infinite",
        "scroll-cue": "scroll-cue 2.2s cubic-bezier(0.22, 1, 0.36, 1) infinite",
        "glow-pulse": "glow-pulse 6s ease-in-out infinite",
        "float-slow": "float-slow 7s ease-in-out infinite",
        "loader-sweep": "loader-sweep 1.6s cubic-bezier(0.22, 1, 0.36, 1) infinite",
      },
      maxWidth: {
        "8xl": "90rem",
      },
    },
  },
  plugins: [
    // Hover-reveal UI only on devices with a real hover pointer; the
    // unprefixed styles are the always-visible touch version.
    plugin(({ addVariant }) => {
      addVariant("can-hover", "@media (hover: hover) and (pointer: fine)");
    }),
  ],
};

export default config;
