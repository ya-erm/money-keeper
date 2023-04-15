import mainService from '$lib/data/main';

export const load = async () => {
  try {
    await mainService.init();
  } catch (e) {
    console.error(e);
  }
};
