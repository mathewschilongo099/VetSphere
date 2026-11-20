/** @type {import('tailwindcss').Config} */
const typography = require('@tailwindcss/typography');

module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // The site is designed for a light theme only. 'class' stops dark: utilities
  // from switching on automatically when a visitor's device is in dark mode,
  // which previously produced unreadable text on white sections.
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [typography],
}
