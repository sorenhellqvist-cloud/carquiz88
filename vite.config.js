import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages with custom domain (timede.se)
  // Use '/' for custom domains, '/repo-name/' for project pages
  base: '/',
})
