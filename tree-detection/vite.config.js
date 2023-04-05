import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: "https://andrewcottam.github.io/web_apps/tree-detection/dist",
  plugins: [react()],
})
