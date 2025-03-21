import forms from "@tailwindcss/forms"
import typography from "@tailwindcss/typography"
import type { Config } from "tailwindcss"

export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  darkMode: "selector", // Use the selector strategy for dark mode
  theme: {
    extend: {}
  },
  plugins: [typography, forms]
} satisfies Config
