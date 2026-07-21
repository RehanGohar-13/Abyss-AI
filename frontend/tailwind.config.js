/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Abyss dark theme colors
        abyss: {
          bg: "#0a0a0f",
          surface: "#13131a",
          border: "#2a2a35",
          accent: "#6366f1",
        },
      },
    },
  },
  plugins: [],
};
