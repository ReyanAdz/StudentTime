import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic', // Enables modern JSX transform
    }),
  ],
  test: {
    environment: 'jsdom',       // Enables DOM support in tests
    globals: true,              // Allows global test(), expect(), etc.
    setupFiles: './src/tests/setup.js' // Enables jest-dom matchers
  }
});
