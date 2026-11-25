/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#090d17",
        panel: "#111827",
        rest: "#67aaff",
        grpc: "#62e6bd",
        soap: "#ffb36b",
        violet: "#b5a2ff",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        sans: ["DM Sans", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px rgb(103 170 255 / 0.13)",
      },
    },
  },
  plugins: [],
};
