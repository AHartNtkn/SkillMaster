import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url'; // Import fileURLToPath

// Get current directory name in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  },
  optimizeDeps: {
    exclude: ['@tauri-apps/api']
  },
  resolve: {
    alias: {
      '@tauri-apps/api/fs': path.resolve(__dirname, 'src/mock-tauri-fs.ts'),
      // You might need to add aliases for other @tauri-apps/api submodules if they also cause issues
      // e.g., '@tauri-apps/api/path': path.resolve(__dirname, 'src/mock-tauri-path.ts'),
    }
  }
});
