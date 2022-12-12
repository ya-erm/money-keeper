import { ApiError } from '$lib/api';
import type { TransactionFullDto } from '$lib/interfaces';
import { db } from '$lib/server';
import { checkNumberParameter, checkUserAndGroup } from '$lib/utils';
import { mapTransaction } from './interfaces';

export type GetTransactionParams = {
  id: number;
};

export async function getTransaction(params: GetTransactionParams, locals: App.Locals): Promise<TransactionFullDto> {
  const { groupId } = checkUserAndGroup(locals);
  const transactionId = checkNumberParameter(params.id, 'id');

  const transaction = await db.transaction.findUnique({
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

  return {
    ...mapTransaction(
      transaction,
      transaction.linkedTransactionId
        ? await db.transaction.findUnique({ where: { id: transaction.linkedTransactionId } })
        : null,
    ),
    category: transaction.category,
    account: transaction.account,
  };
}
