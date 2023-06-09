import { sveltekit } from '@sveltejs/kit/vite';
// import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import type { UserConfig } from 'vite';

const config: UserConfig = {
  plugins: [
    sveltekit(),
    // SvelteKitPWA({
    //   registerType: 'autoUpdate',
    //   devOptions: {
    //     enabled: true,
    //   },
    // }),
  ],
};

export default config;
