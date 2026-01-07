import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Account-Verification/',
  server: {
    host: true, // Allow network access
    port: 5173,
  }
})
