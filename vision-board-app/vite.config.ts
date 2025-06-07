import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: '0.0.0.0'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@/components': path.resolve(__dirname, './client/src/components'),
      '@/hooks': path.resolve(__dirname, './client/src/hooks'),
      '@/lib': path.resolve(__dirname, './client/src/lib'),
      '@/pages': path.resolve(__dirname, './client/src/pages'),
      '@shared': path.resolve(__dirname, './shared')
    }
  },
  root: './client',
  build: {
    outDir: '../dist'
  }
})