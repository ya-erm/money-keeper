import { mainService } from '$lib/data';

export const load = async () => {
  try {
    await mainService.init();
  } catch (e) {
    console.error(e);
  }
};
