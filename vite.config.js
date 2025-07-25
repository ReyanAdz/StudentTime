import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,         // <- this injects `expect`, `describe`, `test` globally
    environment: 'jsdom',  // <- required for React + DOM testing
    setupFiles: './src/tests/setup.js' // <- your global setup (like jest-dom)
  }
});
