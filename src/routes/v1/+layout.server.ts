import type { LayoutServerLoad } from './$types';

// export const ssr = false;

// get `locals` and pass it to the `page` store
export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    userId: locals.userId,
    groupId: locals.groupId,
  };
};
