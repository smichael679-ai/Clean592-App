import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ⚠️ CRITICAL: Must match your GitHub Repo name exactly
  base: '/Clean592-App/', 
  build: {
    outDir: 'dist',
  }
})
