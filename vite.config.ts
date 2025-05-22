/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true, // Optional: to make jest-dom matchers available globally
    setupFiles: './src/setupTests.ts', // Optional: if you have a setup file
  },
})
