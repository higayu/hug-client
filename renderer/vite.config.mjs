import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import autoprefixer from 'autoprefixer'
import path from 'path'
import tailwindcss from 'tailwindcss'
import { fileURLToPath } from 'url'
import tailwindConfig from './tailwind.config.cjs'

const rendererDir = path.dirname(fileURLToPath(import.meta.url))
const resolvedTailwindConfig = {
  ...tailwindConfig,
  content: [
    path.join(rendererDir, 'index.html'),
    path.join(rendererDir, 'src/**/*.{vue,js,ts,jsx,tsx}'),
  ],
}

export default defineConfig({
  plugins: [react()],
  base: './',
  root: rendererDir,
  resolve: {
    alias: {
      '@': path.resolve(rendererDir, 'src'),
      '@assets': path.resolve(rendererDir, 'src/assets'),
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss(resolvedTailwindConfig), autoprefixer()],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
})
