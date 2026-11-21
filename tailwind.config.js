module.exports = {
  content: ["./home.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      colors: {
        medblue: {
          50: '#eff6ff',
          100: '#dbeafe',
          600: '#1d4ed8',
          700: '#0f4c81',
          800: '#0c3b66',
          900: '#092b4c',
        },
        medgreen: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#10b981',
          600: '#0d9488',
          700: '#0f766e',
        },
      },
    },
  },
  plugins: [],
};