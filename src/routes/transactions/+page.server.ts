import { db } from '$lib/server';
import { checkUserAndGroup } from '$lib/utils';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { groupId } = checkUserAndGroup(locals);

  const transactions = await db.transaction.findMany({
    where: { ownerId: groupId },
    orderBy: { date: 'desc' },
    include: {
      account: true,
      category: true,
    },
  });

  return {
    transactions,
  };
};
