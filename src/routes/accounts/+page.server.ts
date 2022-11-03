import { db } from '$lib/server';
import { checkUserAndGroup } from '$lib/utils';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { groupId } = checkUserAndGroup(locals);

  const accounts = await db.account.findMany({
    where: { ownerId: groupId },
    include: {
      transactions: {
        orderBy: { date: 'desc' },
        include: {
          category: true,
        },
      },
    },
  });

  return {
    accounts: accounts.map((account) => ({
      ...account,
      sum: account.transactions.reduce((acc, t) => acc + t.amount * (t.category.type === 'IN' ? 1 : -1), 0),
    })),
  };
};
