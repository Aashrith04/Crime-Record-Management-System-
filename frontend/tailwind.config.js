/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        police: {
          900: "#0b132b",
          800: "#1c2541",
          700: "#3a506b",
          600: "#48cae4",
          500: "#00b4d8",
          accent: "#ff003c"
        }
      }
    },
  },
  plugins: [],
}
