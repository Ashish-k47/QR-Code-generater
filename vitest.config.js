// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use jsdom to simulate a browser environment for DOM/UI tests
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
    },
    // Group tests by folder for clarity in CI reports
    include: ['tests/**/*.test.js'],
    reporters: ['verbose'],
  },
});
