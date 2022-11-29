import { db } from '$lib/server';
import { checkNumberOptionalParameter, checkUserAndGroup } from '$lib/utils';
import { checkAccount } from '../accounts';

export type GetTransactionsParams = {
  accountId?: number | null;
};

export async function getTransactions(params: GetTransactionsParams, locals: App.Locals) {
  const { groupId } = checkUserAndGroup(locals);

  const accountId = checkNumberOptionalParameter(params.accountId, 'accountId') ?? undefined;

  if (accountId) await checkAccount(accountId, locals);

  const transactions = await db.transaction.findMany({
    where: { ownerId: groupId, accountId },
    orderBy: { date: 'desc' },
    include: {
      account: true,
      category: true,
    },
  });

  return {
    transactions: transactions.map((t) => ({
      linkedTransaction: t.linkedTransactionId
        ? transactions.find(({ id }) => id === t.linkedTransactionId)
        : undefined,
      ...t,
    })),
  };
}
