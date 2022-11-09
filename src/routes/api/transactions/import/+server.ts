import type { ImportedTransaction } from '$lib/interfaces';
import { db } from '$lib/server';
import { serverApiError } from '$lib/server/serverError';
import { checkUserAndGroup } from '$lib/utils';
import { checkParameter, getNumberUrlParameter } from '$lib/utils/checkParameter';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ url, request, locals }) => {
  const { groupId } = checkUserAndGroup(locals, { noRedirect: true });

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

  return new Response(
    JSON.stringify({
      count: filteredItems.length,
    }),
  );
};
