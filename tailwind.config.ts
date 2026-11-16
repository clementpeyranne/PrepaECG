import type { Config } from "tailwindcss";

// Toutes les opacités entières (ex. text-pine/78) : sans cela, Tailwind ignore les valeurs
// hors de son échelle par défaut et le texte hérite de la couleur de la page.
const opacity = Object.fromEntries(Array.from({ length: 101 }, (_, value) => [String(value), String(value / 100)]));

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      opacity,
      colors: {
        sand: "rgb(var(--color-sand) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        pine: "rgb(var(--color-pine) / <alpha-value>)",
        moss: "rgb(var(--color-moss) / <alpha-value>)",
        clay: "rgb(var(--color-clay) / <alpha-value>)",
        mist: "rgb(var(--color-mist) / <alpha-value>)"
      },
      boxShadow: {
        panel: "0 20px 60px rgba(20, 34, 29, 0.08)"
      },
      borderRadius: {
        "4xl": "2rem"
      }
    }
  },
  plugins: []
};

export default config;
