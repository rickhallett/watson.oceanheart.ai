import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite'


export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: './frontend',
  build: {
    outDir: '../dist/static',
    emptyOutDir: true
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8888',
        changeOrigin: true,
        secure: false
      },
      '/admin': {
        target: process.env.VITE_API_URL || 'http://localhost:8888', 
        changeOrigin: true,
        secure: false
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'frontend/src'),
      '@tsparticles/react': resolve(__dirname, 'node_modules/@tsparticles/react'),
      '@tsparticles/slim': resolve(__dirname, 'node_modules/@tsparticles/slim'),
      '@tsparticles/engine': resolve(__dirname, 'node_modules/@tsparticles/engine')
    }
  }
});