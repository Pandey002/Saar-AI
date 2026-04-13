import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#E2E4E6", // Micro-adjusted lighter grey (half a pinch)
        ink: "#0E1B2B", // Deep Editorial Navy
        muted: "#64748b",
        line: "#CBD5E1", 
        navy: "#0E1B2B",
        primary: "#059669", // Emerald Green
        emerald: "#10B981", 
        coral: "#F97316",
        cream: "#FAF7F2", // Beige/Cream secondary Card
        surface: "#E2E4E6", 
        "primary-soft": "#D1FAE5",
        success: "#10B981",
        danger: "#EF4444"
      },
      boxShadow: {
        card: "0 18px 40px rgba(15, 23, 42, 0.06)"
      },
      borderRadius: {
        xl: "12px"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-noto-devanagari)", "system-ui", "sans-serif"],
        serif: ["var(--font-libre-baskerville)", "Georgia", "serif"]
      }
    }
  },
  plugins: []
};

export default config;
