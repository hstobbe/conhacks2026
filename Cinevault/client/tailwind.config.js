/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        vault: {
          950: "#050816",
          900: "#0f172a",
          850: "#111c33",
          800: "#17223a",
          700: "#263654",
        },
      },
      boxShadow: {
        glow: "0 0 28px rgba(96, 165, 250, 0.24)",
        "glow-purple": "0 0 28px rgba(168, 85, 247, 0.26)",
      },
    },
  },
  plugins: [],
};
