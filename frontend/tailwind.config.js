/** @type {import('tailwindcss').Config} */
// Willie's Wallet design tokens (matches the website). Mirrored as constants in
// constants/Colors.ts for places that need a raw value (icons, native props).
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'brand-cream': '#FFF7EA', // app and sheet background
        'brand-ink': '#22103D', // all text, every outline, every hard shadow
        'brand-purple': '#401F68', // headers, avatar, Willie's speech
        'brand-purple-mid': '#5A3888', // circle behind Willie on purple
        'brand-yellow': '#FFC93C', // the one accent: primary button, student pass
        'brand-yellow-soft': '#FFE9A8', // highlighter behind "1 use left"
        'brand-green': '#1F7A45', // success and "Unlimited" only
        'brand-lilac': '#E9E2F4', // soft panels, onboarding art, dividers
        'brand-lilac-text': '#EDE4F7', // body text on purple
        'brand-muted': '#4A3A63', // secondary text, inactive tabs
        'brand-willie': '#8C78A4', // active tab icon fill
        'brand-willie-fluff': '#FAE8C5', // Willie's cheek and tail tufts
        'brand-willie-fluff-shade': '#ECC8A6',
        'brand-heart': '#D42C6F', // saved heart
        'brand-danger': '#B42318', // destructive row text only
      },
      fontFamily: {
        // Bricolage Grotesque 800: headlines, offers, names, countdown. Always
        // uppercase; prefer the Display component, which also sets tracking.
        'display': ['BricolageGrotesque_800ExtraBold'],
        'display-lg': ['BricolageGrotesqueDisplay_800ExtraBold'],
        // Figtree: everything else. 700 is the heaviest weight.
        'body': ['Figtree_400Regular'],
        'body-medium': ['Figtree_500Medium'],
        'body-semibold': ['Figtree_600SemiBold'],
        'body-bold': ['Figtree_700Bold'],
        // Willie's speech bubbles only (Chewy stands in for Biski / Lazydog)
        'bubble': ['Chewy_400Regular'],
      },
      borderRadius: {
        'card': '22px',
        'panel': '28px',
        'sheet': '30px',
        'badge': '12px',
      },
    },
  },
  plugins: []
}
