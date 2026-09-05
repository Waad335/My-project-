import type { Config } from "tailwindcss";

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
          400: "#6B4A3D",
          600: "#4F352B",
          700: "#3A2620",
          800: "#2A1B17",
          900: "#1C1210",
        },
        gold: {
          DEFAULT: "#C79A5E",
          50: "#FAF4EA",
          100: "#F0E1C4",
          300: "#DBB984",
          400: "#C79A5E",
          500: "#AD7F45",
          600: "#8C6636",
        },
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
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        "heart-pop": "heart-pop 0.3s ease-out",
        shimmer: "shimmer 2.5s linear infinite",
      },
      maxWidth: {
        "8xl": "90rem",
      },
    },
  },
  plugins: [],
};

export default config;
