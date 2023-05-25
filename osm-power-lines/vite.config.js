import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: "/web_apps/osm-power-lines/dist",
  plugins: [react()],
  server: {
    open: '/web_apps/osm-power-lines/dist',
  },  
})
