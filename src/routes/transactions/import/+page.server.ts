import { deps } from '$lib/deps';
import { db } from '$lib/server';
import { checkNumberUrlParameter, checkUserAndGroup, keyTransactions } from '$lib/utils';

import type { Action, Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals, depends }) => {
  const { groupId } = checkUserAndGroup(locals, { redirect: true });

  const accounts = await db.account.findMany({
    where: { ownerId: groupId },
  });

  depends(deps.categories);
  const categories = await db.category.findMany({
    where: { ownerId: groupId },
  });

  const accountId = checkNumberUrlParameter(url, 'accountId');

  let transactionKeys: string[] = [];
  if (accounts.find((x) => x.id === accountId)) {
    const transactions = await db.transaction.findMany({
      where: { accountId },
    });
    const { keyedItemsMap } = keyTransactions(transactions);
    transactionKeys = [...keyedItemsMap.keys()];
  }

  return {
    accounts,
    categories,
    transactionKeys,
  };
};
