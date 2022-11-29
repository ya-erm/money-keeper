import { deps } from '$lib/deps';
import { db } from '$lib/server';
import { getTransactions } from '$lib/server/api/transactions';
import { checkUserAndGroup } from '$lib/utils';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, depends }) => {
  const { groupId } = checkUserAndGroup(locals, { redirect: true });

  depends(deps.transactions);
  const { transactions } = await getTransactions({}, locals);

  depends(deps.accounts);
  const accounts = await db.account.findMany({
    where: { ownerId: groupId },
  });

  return {
    accounts: accounts.map((account) => {
      const accountTransactions = transactions.filter((t) => t.accountId === account.id);
      return {
        ...account,
        transactions: accountTransactions,
        sum: accountTransactions.reduce((acc, t) => acc + t.amount * (t.category.type === 'IN' ? 1 : -1), 0),
      };
    }),
  };
};
