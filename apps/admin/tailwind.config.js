/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        mc: {
          primary: "rgb(var(--mc-primary-rgb) / <alpha-value>)",
          ink: "rgb(var(--mc-ink-rgb) / <alpha-value>)",
          accent: "rgb(var(--mc-accent-rgb) / <alpha-value>)",
          surface: "rgb(var(--mc-surface-rgb) / <alpha-value>)",
          secondary: "rgb(var(--mc-secondary-rgb) / <alpha-value>)",
          muted: "rgb(var(--mc-muted-rgb) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "-apple-system", "sans-serif"],
        display: ["Space Grotesk", "Manrope", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
