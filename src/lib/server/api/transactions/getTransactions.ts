import type { TransactionDto } from '$lib/interfaces';
import { db } from '$lib/server';
import { checkNumberOptionalParameter, checkUserAndGroup } from '$lib/utils';
import { checkAccount } from '../accounts';
import { mapTransaction, transactionSelection } from './interfaces';

export type GetTransactionsParams = {
  accountId?: number | null;
};

type GetTransactionsReturn = {
  transactions: TransactionDto[];
};

export async function getTransactions(
  params: GetTransactionsParams,
  locals: App.Locals,
): Promise<GetTransactionsReturn> {
  const { groupId } = checkUserAndGroup(locals);

  const accountId = checkNumberOptionalParameter(params.accountId, 'accountId') ?? undefined;

  if (accountId) await checkAccount(accountId, locals);

  const transactions = await db.transaction.findMany({
    where: { ownerId: groupId, accountId },
    orderBy: { date: 'desc' },
    select: transactionSelection,
  });

  return {
    transactions: transactions.map((t) =>
      mapTransaction(t, transactions.find((x) => x.id === t.linkedTransactionId) ?? null),
    ),
  };
}
