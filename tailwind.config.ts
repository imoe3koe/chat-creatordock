import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0A0A0A",
          900: "#121212",
          850: "#171717",
          800: "#1A1A1A",
          700: "#222222",
          600: "#2A2A2A",
        },
        accent: {
          DEFAULT: "#FF6B00",
          hover: "#E65100",
          soft: "#FF8A3D",
          muted: "rgba(255, 107, 0, 0.12)",
        },
        content: {
          primary: "#F5F5F5",
          secondary: "#A3A3A3",
          muted: "#737373",
        },
        surface: {
          DEFAULT: "#1A1A1A",
          hover: "#212121",
          border: "#2A2A2A",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,107,0,0.25), 0 8px 30px rgba(255,107,0,0.12)",
        card: "0 1px 0 rgba(255,255,255,0.03) inset, 0 12px 30px rgba(0,0,0,0.25)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.35s ease-out both",
        "slide-in": "slideIn 0.25s ease-out both",
        shimmer: "shimmer 1.8s infinite",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
