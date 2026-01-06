import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Detta gör att appen fungerar på timede.se/carquiz/
  base: '/carquiz/', 
})
