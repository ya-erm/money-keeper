import { deps } from '$lib/deps';
import { db } from '$lib/server';
import { checkUserAndGroup } from '$lib/utils';

import type { Action, Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, depends }) => {
  const { groupId } = checkUserAndGroup(locals, { redirect: true });

  const accounts = await db.account.findMany({
    where: { ownerId: groupId },
  });

  depends(deps.categories);
  const categories = await db.category.findMany({
    where: { ownerId: groupId },
  });

  return {
    accounts,
    categories,
  };
};
