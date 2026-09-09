import { defineConfig } from 'vite'
import { execSync } from 'child_process'

// Baked in at build time so the deployed UI can show which commit it was built
// from — see #build-version in index.html/main.js. Falls back to 'dev' if run
// outside a git checkout (e.g. a stripped deploy artifact).
function getCommitSha() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'dev'
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  base: "/web_apps/openlayers/restoration-progress/dist/",
  server: {
    open: true,
  },
  define: {
    __COMMIT_SHA__: JSON.stringify(getCommitSha()),
  },
})
