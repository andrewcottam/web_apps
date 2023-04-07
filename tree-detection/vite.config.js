import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: "/web_apps/tree-detection/dist",
  plugins: [react()],
  server: {
    open: '/web_apps/tree-detection/dist',
  },  
})
