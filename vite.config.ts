import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/server.ts'),
      formats: ['es'],
      fileName: 'server',
    },
    rollupOptions: {
      external: [
        // Node built-ins
        /^node:/,
        'fs',
        'path',
        'url',
        'stream',
        'util',
        'events',
        'crypto',
        'buffer',
        'process',
        'os',
        'child_process',
        // All npm packages (externalize everything from node_modules)
        /^@modelcontextprotocol\//,
        'zod',
        // Externalize all dependencies
        /^[\w@]/,
      ],
      output: {
        banner: '#!/usr/bin/env node',
      },
    },
    target: 'node20',
    sourcemap: true,
    minify: false,
    outDir: 'dist',
    ssr: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
