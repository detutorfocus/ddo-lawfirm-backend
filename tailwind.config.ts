// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#C9A84C",
          light: "#E8D6A7",
          dark: "#8B7536",
          pale: "#F5EFE6",
        },
        cream: {
          DEFAULT: "#FAF7F2",
          light: "#F5EFE6",
        },
        firm: {
          black: "#1A1A1A",
          mid: "#4A4A4A",
          light: "#888888",
          border: "#E8DDD0",
        },
      },
      fontFamily: {
        serif: ["EB Garamond", "Georgia", "Times New Roman", "serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        gold: "0 4px 16px rgba(201,168,76,0.25)",
        "gold-lg": "0 8px 32px rgba(201,168,76,0.35)",
        card: "0 1px 4px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.08)",
      },
      borderRadius: {
        firm: "3px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease forwards",
        "slide-up": "slideUp 0.4s ease forwards",
        "spin-slow": "spin 2s linear infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};

export default config;
