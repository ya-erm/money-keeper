import { deps } from '$lib/deps';
import { db } from '$lib/server';
import { getImportRules } from '$lib/server/api/importRules';
import { checkNumberOptionalUrlParameter, checkUserAndGroup, keyTransactions } from '$lib/utils';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals, depends }) => {
  const { groupId } = checkUserAndGroup(locals, { redirect: true });

  depends(deps.accounts);
  const accounts = await db.account.findMany({
    where: { ownerId: groupId },
  });

  depends(deps.categories);
  const categories = await db.category.findMany({
    where: { ownerId: groupId },
  });

  depends(deps.importRules);
  const rules = await getImportRules(locals);

  const accountId = checkNumberOptionalUrlParameter(url, 'accountId');

  let transactionKeys: string[] = [];
  if (accountId && accounts.find((x) => x.id === accountId)) {
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
    rules,
  };
};
