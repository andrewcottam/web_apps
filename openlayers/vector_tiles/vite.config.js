import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: "/web_apps/openlayers/vector_tiles/dist/",
  server: {
    open: true,
  },
})
