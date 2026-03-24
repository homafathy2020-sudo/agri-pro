/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        arabic: ["Cairo", "Tajawal", "sans-serif"],
      },
      colors: {
        brand: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        surface: {
          DEFAULT: "#111827",
          2: "#1a2235",
          3: "#1f2d42",
        },
        dark: {
          DEFAULT: "#0a0f1e",
          2: "#0d1526",
        },
      },
      screens: {
        xs: "480px",
      },
    },
  },
  plugins: [],
};
