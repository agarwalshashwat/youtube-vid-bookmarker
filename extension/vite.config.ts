import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  build: {
    rollupOptions: {
      // bookmarks.html is in web_accessible_resources; add it explicitly as an entry
      // so Vite bundles the React dashboard just like the side panel
      input: {
        bookmarks: resolve(__dirname, 'src/pages/bookmarks.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@clipmark/core': resolve(__dirname, '../packages/core/src/index.ts'),
      '@clipmark/types': resolve(__dirname, '../packages/types/src/index.ts'),
    },
  },
});
