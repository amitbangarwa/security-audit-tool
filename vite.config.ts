import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension from 'vite-plugin-web-extension';
import { readFileSync } from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: () => JSON.parse(readFileSync('./manifest.json', 'utf-8')),
      additionalInputs: ['src/content/index.ts'],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
  },
});
