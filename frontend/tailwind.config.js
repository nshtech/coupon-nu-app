/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'nu-purple': '#4E2A84',
        'purple-80': '#684C96',
        'purple-70': '#765DA0',
        'purple-60': '#836EAA',
        'purple-50': '#9380B6',
        'purple-40': '#A495C3',
        'purple-30': '#B6ACD1',
        'purple-20': '#CCC4DF',
      },
      fontFamily: {
        'inter': ['Inter', 'system-ui', 'sans-serif'],
        'inter-medium': ['InterMedium', 'system-ui', 'sans-serif'],
        'inter-bold': ['InterBold', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: []
}

