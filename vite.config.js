import { defineConfig } from 'vite'

export default defineConfig({
  // './' = rutas relativas -> el build de dist/ abre con doble clic (file://)
  base: './',
  server: {
    port: 5173,
    strictPort: false, // si 5173 esta ocupado, Vite busca el siguiente libre
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  }
})
