import { db } from '$lib/server';
import { checkUserAndGroup } from '$lib/utils';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { groupId } = checkUserAndGroup(locals);

  const accounts = await db.account.findMany({
    where: { ownerId: groupId },
  });

  return {
    accounts,
  };
};
