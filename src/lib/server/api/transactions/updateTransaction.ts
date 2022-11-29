import { db } from '$lib/server';
import { checkNumberParameter, checkStringOptionalParameter, checkStringParameter } from '$lib/utils';
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
  const date = checkStringParameter(data.date, 'date');
  const time = checkStringParameter(data.time, 'time');
  const comment = checkStringOptionalParameter(data.comment, 'comment');

  const transaction = await checkTransaction(transactionId, locals);
  const account = await checkAccount(accountId, locals);
  const category = await checkCategory(categoryId, locals);

  const updatedTransaction = await db.transaction.update({
    where: { id: transaction.id },
    data: {
      owner: { connect: { id: groupId } },
      account: { connect: { id: account.id } },
      category: { connect: { id: category.id } },
      date: new Date(`${date}T${time}`),
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
