import type { ImportedTransaction } from '$lib/interfaces';
import { db, withRequestHandlerMiddleware, serverApiError } from '$lib/server';
import { checkUserAndGroup, checkParameter, checkNumberUrlParameter, keyTransactions } from '$lib/utils';
import type { RequestHandler } from './$types';

export const POST = withRequestHandlerMiddleware<RequestHandler>(async ({ url, request, locals }) => {
  const { groupId } = checkUserAndGroup(locals);

  const accountId = checkNumberUrlParameter(url, 'accountId');

  const account = await db.account.findUnique({ where: { id: accountId } });

  if (account?.ownerId !== groupId) {
    throw serverApiError(403, 'FORBIDDEN');
  }

  const ignoredItems: ImportedTransaction[] = [];

  const data = await request.json();

  const items = checkParameter<Array<ImportedTransaction>>(data.items, 'items', { required: true, type: 'array' });
  const itemsWithCategory = items.filter((item) => {
    const hasCategory = !!item.categoryId;
    if (!hasCategory) ignoredItems.push(item);
    return hasCategory;
  });
  const { keyedItems } = keyTransactions(itemsWithCategory);

  const transactions = await db.transaction.findMany({
    where: { accountId },
  });

  const { keyedItemsMap: keyedTransactionsMap } = keyTransactions(transactions);

  const filteredItems = keyedItems.filter((item) => {
    const alreadyExists = keyedTransactionsMap.has(item.uniqueKey);
    if (alreadyExists) ignoredItems.push(item);
    return !alreadyExists;
  });

  if (filteredItems.length > 0) {
    await db.account.update({
      where: { id: accountId },
      data: {
        transactions: {
          create: filteredItems.map((item) => ({
            date: new Date(item.date),
            amount: item.amount,
            comment: item.comment,
            categoryId: item.categoryId,
            ownerId: groupId,
            tags: { connect: item.tags?.map((id) => ({ id })) },
          })),
        },
      },
    });
  }

  return new Response(
    JSON.stringify({
      count: filteredItems.length,
      ignoredItems,
    }),
  );
});
