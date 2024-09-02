import adapter from '@sveltejs/adapter-auto'; // https://github.com/sveltejs/kit/tree/master/packages/adapter-node#readme
import autoprefixer from 'autoprefixer';
import { sveltePreprocess } from 'svelte-preprocess';

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const file = fileURLToPath(new URL('package.json', import.meta.url));
const json = readFileSync(file, 'utf8');
const pkg = JSON.parse(json);

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: sveltePreprocess({
    postcss: {
      plugins: [autoprefixer()],
    },
  }),

  kit: {
    adapter: adapter(),
    version: {
      name: pkg.version,
    },
    alias: {
      $lib: './src/lib',
      '$lib/*': './src/lib/*',
      '@tests/*': './tests/*',
    },
  },
};

export default config;
