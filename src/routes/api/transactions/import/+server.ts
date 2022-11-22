import type { ImportedTransaction } from '$lib/interfaces';
import { db, withRequestHandlerMiddleware, serverApiError } from '$lib/server';
import { checkUserAndGroup, checkParameter, getNumberUrlParameter } from '$lib/utils';
import type { RequestHandler } from './$types';

export const POST = withRequestHandlerMiddleware<RequestHandler>(async ({ url, request, locals }) => {
  const { groupId } = checkUserAndGroup(locals);

  const accountId = getNumberUrlParameter(url, 'accountId');

  const account = await db.account.findUnique({ where: { id: accountId } });

  if (account?.ownerId !== groupId) {
    throw serverApiError(403, 'FORBIDDEN');
  }

  const data = await request.json();

  const items = checkParameter<Array<ImportedTransaction>>(data.items, 'items', { required: true, type: 'array' });

  const transactions = await db.transaction.findMany({
    where: { accountId },
  });

  const filteredItems = items.filter(
    (item) => !!item.categoryId && !transactions.some((t) => t.date.getTime() === new Date(item.date).getTime()),
  );

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
          })),
        },
      },
    });
  }

  return new Response(
    JSON.stringify({
      count: filteredItems.length,
    }),
  );
});
