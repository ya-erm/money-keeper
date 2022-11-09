import type { LayoutServerLoad } from './$types';

// get `locals` and pass it to the `page` store
export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    userId: locals.userId,
    groupId: locals.groupId,
  };
};
