import { sveltekit } from '@sveltejs/kit/vite';
// import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import type { UserConfig } from 'vite';

type UserConfigWithTest = UserConfig & {
  test: { include: string[] };
};

const config: UserConfigWithTest = {
  // Worker imports are not discovered by the initial browser dependency scan.
  // Prebundle them so the first QR read does not reload the open operation form.
  optimizeDeps: { include: ['jsqr', 'zxing-wasm/reader'] },
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
