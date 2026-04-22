/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  corePlugins: {
    preflight: false, // Disable Tailwind's base styles to prevent conflicts
  },
  safelist: [
    {
      pattern:
        /(bg|text)-(red|blue|green|yellow|pink|purple|gray|indigo|teal|cyan|lime|amber|orange|rose|fuchsia|violet|sky|emerald|stone)-(\d{2,3})/,
    },
  ],
  plugins: [],
};
