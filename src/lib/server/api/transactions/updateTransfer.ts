import { ApiError } from '$lib/api';
import { db } from '$lib/server/database';
import {
  checkArrayOptionalParameter,
  checkNumberParameter,
  checkStringOptionalParameter,
  checkStringParameter,
} from '$lib/utils';
import { checkGroupId } from '$lib/utils/checkUser';
import { checkAccount } from '../accounts';
import type { CreateTransferRequestData } from './createTransfer';
import { checkTransaction, getOrCreateTransferInSystemCategory, getOrCreateTransferOutSystemCategory } from './utils';

export type UpdateTransferParams = {
  id: number;
};

export type UpdateTransferRequestData = CreateTransferRequestData;

export async function updateTransfer(
  params: UpdateTransferParams,
  data: UpdateTransferRequestData,
  locals: App.Locals,
) {
  const groupId = checkGroupId(locals);

  const transactionId = checkNumberParameter(params.id, 'id');

  const sourceAccountId = checkNumberParameter(data.source.accountId, 'sourceAccountId');
  const sourceAmount = checkNumberParameter(data.source.amount, 'sourceAmount');
  const destinationAccountId = checkNumberParameter(data.destination.accountId, 'destinationAccountId');
  const destinationAmount = checkNumberParameter(data.destination.amount, 'destinationAmount');
  const dateTime = checkStringParameter(data.dateTime, 'dateTime');
  const comment = checkStringOptionalParameter(data.comment, 'comment');
  const tags = checkArrayOptionalParameter<number>(data.tags, 'tags', { type: 'number', required: true });

  if (sourceAccountId === destinationAccountId) {
    throw new ApiError(400, 'BAD_REQUEST', 'Source and destination accounts must be different');
  }
  const transaction = await checkTransaction(transactionId, locals);

  const tagsToRemove = transaction.tags.filter((t) => !tags?.includes(t.id));

  const sourceAccount = await checkAccount(sourceAccountId, locals);
  const destinationAccount = await checkAccount(destinationAccountId, locals);

  const transferOutCategory = await getOrCreateTransferOutSystemCategory();
  const transferInCategory = await getOrCreateTransferInSystemCategory();

  const { t1, t2 } = await db.$transaction(async (tx) => {
    const t1 = await tx.transaction.update({
      where: { id: transaction.id },
      data: {
        accountId: sourceAccount.id,
        categoryId: transferOutCategory.id,
        amount: sourceAmount,
        date: dateTime,
        comment,
        tags: {
          connect: tags?.map((tagId) => ({ id: tagId })),
          disconnect: tagsToRemove?.map((tag) => ({ id: tag.id })),
        },
      },
    });
    if (transaction.linkedTransactionId) {
      const t2 = await tx.transaction.update({
        where: { id: transaction.linkedTransactionId },
        data: {
          accountId: destinationAccount.id,
          categoryId: transferInCategory.id,
          amount: destinationAmount,
          date: dateTime,
          comment,
          tags: {
            connect: tags?.map((tagId) => ({ id: tagId })),
            disconnect: tagsToRemove?.map((tag) => ({ id: tag.id })),
          },
        },
      });
      return { t1, t2 };
    } else {
      const t2 = await tx.transaction.create({
        data: {
          ownerId: groupId,
          accountId: destinationAccount.id,
          categoryId: transferInCategory.id,
          amount: destinationAmount,
          date: dateTime,
          comment,
          linkedTransactionId: t1.id,
        },
      });
      const t1Updated = await tx.transaction.update({
        where: { id: t1.id },
        data: {
          linkedTransactionId: t2.id,
        },
      });
      return { t1: t1Updated, t2 };
    }
  });

  return { t1, t2 };
}
