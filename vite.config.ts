import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static SPA deployed to Azure Static Web Apps at the domain root, so assets
// are served from absolute '/...' paths (works on every route, including
// deep links like /item/:id after the SPA navigation fallback).
export default defineConfig({
  plugins: [react()],
  base: '/',
})
