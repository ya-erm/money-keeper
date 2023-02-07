import { db } from '$lib/server';
import {
  checkArrayOptionalParameter,
  checkNumberParameter,
  checkStringOptionalParameter,
  checkStringParameter,
} from '$lib/utils';
import { checkGroupId } from '$lib/utils/checkUser';
import { checkAccount } from '../accounts';
import { checkCategory } from '../categories';

import type { CreateTransactionRequestData } from './createTransaction';
import { checkTransaction } from './utils';

export type UpdateTransactionParams = {
  id: number;
};

export type UpdateTransactionRequestData = CreateTransactionRequestData;

export async function updateTransaction(
  params: UpdateTransactionParams,
  data: UpdateTransactionRequestData,
  locals: App.Locals,
) {
  const groupId = checkGroupId(locals);
  const transactionId = checkNumberParameter(params.id, 'id');

  const accountId = checkNumberParameter(data.accountId, 'accountId');
  const categoryId = checkNumberParameter(data.categoryId, 'categoryId');
  const amount = checkNumberParameter(data.amount, 'amount');
  const dateTime = checkStringParameter(data.dateTime, 'dateTime');
  const comment = checkStringOptionalParameter(data.comment, 'comment');
  const tags = checkArrayOptionalParameter<number>(data.tags, 'tags', { type: 'number', required: true });

  const transaction = await checkTransaction(transactionId, locals);
  const account = await checkAccount(accountId, locals);
  const category = await checkCategory(categoryId, locals);

  const tagsToRemove = transaction.tags.filter((t) => !tags?.includes(t.id));

  const updatedTransaction = await db.transaction.update({
    where: { id: transaction.id },
    data: {
      owner: { connect: { id: groupId } },
      account: { connect: { id: account.id } },
      category: { connect: { id: category.id } },
      tags: {
        connect: tags?.map((tagId) => ({ id: tagId })),
        disconnect: tagsToRemove?.map((tag) => ({ id: tag.id })),
      },
      date: dateTime,
      amount,
      comment,
    },
    include: {
      account: true,
      category: true,
    },
  });

  return updatedTransaction;
}
