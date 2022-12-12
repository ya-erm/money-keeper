import { deps } from '$lib/deps';
import { db } from '$lib/server';
import { getTransactions } from '$lib/server/api/transactions';
import { checkUserAndGroup } from '$lib/utils';
import type { Category } from '@prisma/client';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, depends }) => {
  const { groupId } = checkUserAndGroup(locals, { redirect: true });

  depends(deps.categories);
  const categories = await db.category.findMany({
    where: { ownerId: groupId },
  });

  const _categories = new Map<number, Category>(categories.map((c) => [c.id, c]));

  depends(deps.transactions);
  const { transactions } = await getTransactions({}, locals);

  depends(deps.accounts);
  const accounts = await db.account.findMany({
    where: { ownerId: groupId },
    orderBy: { order: 'asc' },
  });

  return {
    accounts: accounts.map((account) => ({
      ...account,
      sum: transactions
        .filter((t) => t.accountId === account.id)
        .reduce((acc, t) => acc + t.amount * (_categories.get(t.categoryId)?.type === 'OUT' ? -1 : 1), 0),
    })),
    categories,
    transactions,
  };
};
