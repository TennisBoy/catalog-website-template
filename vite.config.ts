import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static SPA, hostable on GitHub Pages / Netlify. Relative base ('./') keeps
// asset and config paths working under a project subpath like
// /catalogEngDep/ (GitHub Pages) without hardcoding the repo name.
export default defineConfig({
  plugins: [react()],
  base: './',
})
