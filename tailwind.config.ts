import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#1e3a8a",
          600: "#1e40af",
          700: "#1d4ed8",
          800: "#1e3a8a",
          900: "#172554",
        },
        accent: {
          DEFAULT: "#f59e0b",
          light: "#fef3c7",
          dark:  "#d97706",
        },
        surface: {
          DEFAULT: "#f8fafc",
          card:    "#ffffff",
          border:  "#e2e8f0",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Sora", "Inter", "sans-serif"],
        mono:  ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        modal:"0 20px 60px -10px rgb(0 0 0 / 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
