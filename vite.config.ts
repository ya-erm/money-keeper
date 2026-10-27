import adapterAuto from '@sveltejs/adapter-auto';
import adapterNode from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import autoprefixer from 'autoprefixer';
import { readFileSync } from 'node:fs';
import { sveltePreprocess } from 'svelte-preprocess';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig(({ mode }) => ({
  // Prebundle worker dependencies before the first QR read.
  optimizeDeps: { include: ['jsqr', 'zxing-wasm/reader'] },
  plugins: [
    sveltekit({
      preprocess: sveltePreprocess({ postcss: { plugins: [autoprefixer()] } }),
      adapter: process.env.BUILD_ADAPTER === 'node' ? adapterNode() : adapterAuto(),
      paths: {
        origin:
          process.env.BUILD_ADAPTER === 'node' ? loadEnv(mode, process.cwd(), 'ORIGIN').ORIGIN || undefined : undefined,
      },
      // Inline small route styles so the HTML startup screen can paint before downloads.
      inlineStyleThreshold: 16384,
      version: { name: pkg.version },
    }),
  ],
  test: { include: ['src/**/*.test.ts'] },
}));
