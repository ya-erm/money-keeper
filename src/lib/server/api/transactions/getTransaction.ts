import { ApiError } from '$lib/api';
import type { TransactionWithAccountAndCategory } from '$lib/interfaces';
import { db } from '$lib/server';
import { checkNumberParameter, checkUserAndGroup } from '$lib/utils';

export type GetTransactionParams = {
  id: number;
};

export async function getTransaction(params: GetTransactionParams, locals: App.Locals) {
  const { groupId } = checkUserAndGroup(locals);
  const transactionId = checkNumberParameter(params.id, 'id');

  const transaction: TransactionWithAccountAndCategory | null = await db.transaction.findUnique({
    where: { id: transactionId },
    include: {
      account: true,
      category: true,
    },
  });

  if (!transaction) {
    throw new ApiError(404, 'NOT_FOUND', `Transaction #${transactionId} not found`);
  }

  if (transaction.ownerId !== groupId) {
    throw new ApiError(403, 'FORBIDDEN', `You have no access to transaction #${transactionId}`);
  }

  if (transaction.linkedTransactionId) {
    transaction.linkedTransaction =
      (await db.transaction.findUnique({
        where: { id: transaction.linkedTransactionId },
        include: {
          account: true,
          category: true,
        },
      })) ?? undefined;
  }

  return transaction;
}
