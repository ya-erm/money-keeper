import { db } from '$lib/server';
import { checkNumberParameter } from '$lib/utils';

import { checkTransaction } from './utils';

export type DeleteTransactionParams = {
  id: number;
};

export async function deleteTransaction(params: DeleteTransactionParams, locals: App.Locals) {
  const transactionId = checkNumberParameter(params.id, 'id');

  const transaction = await checkTransaction(transactionId, locals);

  await db.$transaction(async (tx) => {
    await tx.transaction.delete({
      where: { id: transactionId },
    });
    if (transaction.linkedTransactionId) {
      await tx.transaction.delete({
        where: { id: transaction.linkedTransactionId },
      });
    }
  });
}
