import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom', // Enables DOM in Vitest
    globals: true,         // Allows global test(), expect(), etc.
    setupFiles: './src/tests/setup.js' // Enables jest-dom matchers
  }
})
