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
          DEFAULT: "#b8963e",
          light: "#f0e6d3",
          dark: "#9a7d2e",
        },
        charcoal: {
          DEFAULT: "#2a2a2a",
          light: "#3d3d3d",
          dark: "#171717",
        },
        cream: {
          DEFAULT: "#fafaf9",
          dark: "#f5f5f4",
        },
      },
      fontFamily: {
        heading: ["Cormorant Garamond", "serif"],
        body: ["DM Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
