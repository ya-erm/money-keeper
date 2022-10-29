import { db } from '$lib/server';
import { checkUserAndGroup } from '$lib/utils';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { groupId } = checkUserAndGroup(locals);

  const categories = await db.category.findMany({
    where: { ownerId: groupId },
  });

  return {
    categories,
  };
};
