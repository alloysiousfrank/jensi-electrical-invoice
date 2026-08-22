import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Root-relative base — correct for Vercel (serves from the domain root)
  // and for GitHub Pages via a custom/project domain. If you ever deploy
  // to https://<user>.github.io/chromatic-invoice/ specifically (a path,
  // not a root domain), that build needs base: "/chromatic-invoice/" instead.
  base: "/",
});
