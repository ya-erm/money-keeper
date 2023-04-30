import { ApiError } from '$lib/api';
import { db } from '$lib/server/database';
import { SYSTEM_CATEGORY_TRANSFER_IN, SYSTEM_CATEGORY_TRANSFER_OUT } from '$lib/server/database/system';
import { checkGroupId } from '$lib/utils/checkUser';

export async function getOrCreateTransferInSystemCategory() {
  let transferInCategory = await db.category.findFirst({
    where: { ownerId: null, name: SYSTEM_CATEGORY_TRANSFER_IN.name },
  });
  if (!transferInCategory) {
    transferInCategory = await db.category.create({
      data: SYSTEM_CATEGORY_TRANSFER_IN,
    });
  }
  return transferInCategory;
}

export async function getOrCreateTransferOutSystemCategory() {
  let transferOutCategory = await db.category.findFirst({
    where: { ownerId: null, name: SYSTEM_CATEGORY_TRANSFER_OUT.name },
  });
  if (!transferOutCategory) {
    transferOutCategory = await db.category.create({
      data: SYSTEM_CATEGORY_TRANSFER_OUT,
    });
  }
  return transferOutCategory;
}

export async function checkTransaction(transactionId: number, locals: App.Locals) {
  const groupId = checkGroupId(locals);

  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
    include: {
      tags: true,
    },
  });

  if (!transaction) {
    throw new ApiError(404, 'NOT_FOUND', `Transaction #${transactionId} not found`);
  }

  if (transaction.ownerId !== groupId) {
    throw new ApiError(403, 'FORBIDDEN', `You have no access to transaction #${transactionId}`);
  }

  return transaction;
}
