/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#eab308',
          50: '#fefce8',
          500: '#eab308',
          600: '#ca8a04',
        },
        secondary: {
          DEFAULT: '#166534',
        }
      },
    },
  },
  plugins: [],
}
