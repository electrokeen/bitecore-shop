/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Дозволяє вмикати темну тему
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#2563eb', // Фірмовий синій колір Bitecore
          dark: '#1d4ed8',
          accent: '#f59e0b' // Помаранчевий для акцій
        }
      }
    },
  },
  plugins: [],
}