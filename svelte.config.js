import adapter from '@sveltejs/adapter-node'; // https://github.com/sveltejs/kit/tree/master/packages/adapter-node#readme
import preprocess from 'svelte-preprocess';
import autoprefixer from 'autoprefixer';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: preprocess({
    postcss: {
      plugins: [autoprefixer()]
    }
  }),

  kit: {
    adapter: adapter()
  }
};

export default config;
