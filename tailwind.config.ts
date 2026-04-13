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
        canvas: "#F9F7F2", // Old Notebook Parchment
        ink: "#111827", // Ink
        muted: "#78716C", // Stone-muted
        line: "#D6D3D1", // Muted Border
        navy: "#111827",
        primary: "#059669", // Emerald
        emerald: "#059669", 
        coral: "#F97316",
        sand: "#F3E9D2",
        surface: "#F3E9D2", // Soft Sand
        "primary-soft": "#D1FAE5",
        success: "#059669",
        danger: "#B91C1C"
      },
      boxShadow: {
        card: "0 14px 40px rgba(28, 25, 23, 0.08)",
        sm: "0 2px 4px rgba(28, 25, 23, 0.04)"
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
