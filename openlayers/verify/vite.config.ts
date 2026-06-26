import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const buildTime = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/web_apps/openlayers/verify/dist/',
  plugins: [react()],
  define: {
    __GIT_SHA__: JSON.stringify(buildTime),
  },
}))
