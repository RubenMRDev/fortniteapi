export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        fontFamily: {
            'luckiest': ['"Luckiest Guy"', 'cursive'],
            'oswald': ['"Oswald"', 'sans-serif'],
        },
        colors: {
            'bg-color': '#1a0b2e',
            'card-bg': '#1e1e24',
            'accent': '#fcee0a',
            'rarity-common': '#b1b1b1',
            'rarity-uncommon': '#60aa3a',
            'rarity-rare': '#49acf2',
            'rarity-epic': '#b15be2',
            'rarity-legendary': '#d37841',
            'rarity-icon': '#35aeb8',
        }
      },
    },
    plugins: [],
  }