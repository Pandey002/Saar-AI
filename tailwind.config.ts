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
        canvas: "#f8fafc",
        ink: "#111827",
        muted: "#6b7280",
        line: "#dbe4f0",
        primary: "#2563eb",
        "primary-soft": "#dbeafe",
        surface: "#ffffff",
        accent: "#eef4ff",
        lilac: "#f4efff",
        success: "#16a34a",
        danger: "#dc2626"
      },
      boxShadow: {
        card: "0 18px 40px rgba(15, 23, 42, 0.06)"
      },
      borderRadius: {
        xl: "12px"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
