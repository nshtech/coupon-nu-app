/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Willie's Wallet palette (design rework values)
        'brand-purple': '#4e2078',
        'brand-purple-mid': '#7b6496',
        'brand-purple-soft': '#8b75a1',
        'brand-cream': '#fceac3',
        'brand-cream-soft': '#fff8eb',
        'brand-tan': '#d4b267',
        'brand-peach': '#efc6a4',
        'brand-lavender': '#f1e6f8',
        'brand-mint': '#e3efe6',
        'brand-yellow': '#ffd25e',
        'brand-danger': '#b42318',
        'brand-ink': '#28173b',

        // legacy tokens, repointed onto the brand palette
        'nu-purple': '#4e2078',
        'purple-80': '#4e2078',
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
        'display-medium': ['Fredoka_500Medium'],
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
        'card': '24px',
        'sheet': '32px',
      },
    },
  },
  plugins: []
}
