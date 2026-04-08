/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        homedepot: {
          orange: '#F96302'
        }
      }
    },
  },
  plugins: [],
}
