import { browser } from '$app/environment';

import { mainService } from '$lib/data';

export const load = async () => {
  if (!browser) {
    return;
  }

  try {
    await mainService.init();
  } catch (e) {
    console.error(e);
  }
};
