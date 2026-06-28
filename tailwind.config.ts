import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        'rw-black': 'var(--rw-black)',
        'rw-charcoal': 'var(--rw-charcoal)',
        'rw-red': 'var(--rw-red)',
        'rw-red-deep': 'var(--rw-red-deep)',
        'rw-bone': 'var(--rw-bone)',
      },
    },
  },
  plugins: [],
};
export default config;
