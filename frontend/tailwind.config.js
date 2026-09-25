/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Willie's Wallet style sheet palette
        'brand-purple': '#401f68',
        'brand-purple-mid': '#7b6496',
        'brand-purple-soft': '#8a7aa2',
        'brand-cream': '#fae8c5',
        'brand-cream-soft': '#fdf6e8',
        'brand-tan': '#d1b582',
        'brand-peach': '#efc6a4',
        'brand-ink': '#2b1546',

        // legacy tokens, repointed onto the brand palette
        'nu-purple': '#401f68',
        'purple-80': '#401f68',
        'purple-70': '#523080',
        'purple-60': '#634296',
        'purple-50': '#7b6496',
        'purple-40': '#8a7aa2',
        'purple-30': '#a496b5',
        'purple-20': '#c4b9cf',
        'purple-like-gray': '#a496b5',
        'dark-gray': '#6f6379',
      },
      fontFamily: {
        // display — TT Masters stand-in
        'display': ['Fredoka_600SemiBold'],
        'display-bold': ['Fredoka_700Bold'],
        // body — Aileron / Ubuntu
        'body': ['Ubuntu_400Regular'],
        'body-medium': ['Ubuntu_500Medium'],
        'body-bold': ['Ubuntu_700Bold'],
        // legacy aliases (incl. the previously undefined font-inter-regular)
        'inter': ['Ubuntu_400Regular'],
        'inter-regular': ['Ubuntu_400Regular'],
        'inter-medium': ['Ubuntu_500Medium'],
        'inter-bold': ['Ubuntu_700Bold'],
      },
      borderRadius: {
        'card': '20px',
      },
    },
  },
  plugins: []
}
