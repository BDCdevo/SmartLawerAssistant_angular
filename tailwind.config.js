/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#009688',
          light: '#00C48C',
          dark: '#00796B',
        },
        secondary: {
          DEFAULT: '#0288D1',
          light: '#03A9F4',
          dark: '#01579B',
        },
        danger: {
          DEFAULT: '#E53935',
          light: '#EF5350',
          dark: '#C62828',
        },
        success: {
          DEFAULT: '#43A047',
          light: '#66BB6A',
          dark: '#2E7D32',
        },
        warning: {
          DEFAULT: '#FFA726',
          light: '#FFB74D',
          dark: '#F57C00',
        },
        info: {
          DEFAULT: '#29B6F6',
          light: '#4FC3F7',
          dark: '#0288D1',
        },
      },
      fontFamily: {
        sans: ['Cairo', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
