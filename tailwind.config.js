/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./navigation/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#0A0A0A",
          darkred: "#7B0D0D",
          red: "#B91C1C",
          gold: "#D4AF37",
          lightgold: "#F5D06A",
          gray: "#1A1A1A",
          muted: "#3A3A3A",
        },
      },
    },
  },
  plugins: [],
};