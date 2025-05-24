import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    globals: true,
    env: {
      NODE_ENV: 'test'
    }
  },
  resolve: {
    alias: {
      'fsrs.js': resolve(__dirname, './tests/__mocks__/fsrs.js')
    }
  }
});