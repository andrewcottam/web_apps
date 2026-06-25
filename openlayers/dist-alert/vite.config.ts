import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

const gitSha = execSync('git rev-parse --short HEAD').toString().trim()

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/web_apps/openlayers/dist-alert/dist/',
  plugins: [react()],
  define: {
    __GIT_SHA__: JSON.stringify(gitSha),
  },
}))
