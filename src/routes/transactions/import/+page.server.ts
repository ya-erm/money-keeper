import { db } from '$lib/server';
import { checkUserAndGroup } from '$lib/utils';

import type { Action, Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { groupId } = checkUserAndGroup(locals);

  const accounts = await db.account.findMany({
    where: { ownerId: groupId },
  });

  const categories = await db.category.findMany({
    where: { ownerId: groupId },
  });

  return {
    accounts,
    categories,
  };
};
