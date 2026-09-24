import { sveltekit } from '@sveltejs/kit/vite';
// import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import type { UserConfig } from 'vite';

type UserConfigWithTest = UserConfig & {
  test: { include: string[] };
};

const config: UserConfigWithTest = {
  plugins: [
    sveltekit(),
    // SvelteKitPWA({
    //   registerType: 'autoUpdate',
    //   devOptions: {
    //     enabled: true,
    //   },
    // }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
  },
};

export default config;
