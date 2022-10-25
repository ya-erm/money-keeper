import type { LayoutServerLoad } from './$types';

// get `locals` and pass it to the `page` store
export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    user: locals.user,
    groupId: locals.groupId,
  };
};
