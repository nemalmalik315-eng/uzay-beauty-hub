import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#c5a03f",
          light: "#f5e6c8",
          dark: "#a8872e",
        },
        charcoal: {
          DEFAULT: "#2a2a2a",
          light: "#3d3d3d",
          dark: "#1a1a1a",
        },
        cream: {
          DEFAULT: "#faf8f5",
          dark: "#f0ece5",
        },
      },
      fontFamily: {
        heading: ["Playfair Display", "serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
