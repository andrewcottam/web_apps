import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: "/web_apps/open_layers/vector_tiles/dist",
  server: {
    open: 'web_apps/open_layers/vector_tiles/dist',
  },  
})
