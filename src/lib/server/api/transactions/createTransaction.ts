import { db } from '$lib/server';
import { checkNumberParameter, checkStringOptionalParameter, checkStringParameter, join } from '$lib/utils';
import { checkGroupId } from '$lib/utils/checkUser';

import { checkAccount } from '../accounts';
import { checkCategory } from '../categories';

export type CreateTransactionRequestData = {
  accountId: number;
  categoryId: number;
  amount: number;
  date: string;
  time: string;
  comment?: string | null;
};

export async function createTransaction(data: CreateTransactionRequestData, locals: App.Locals) {
  const accountId = checkNumberParameter(data.accountId, 'accountId');
  const categoryId = checkNumberParameter(data.categoryId, 'categoryId');
  const amount = checkNumberParameter(data.amount, 'amount');
  const date = checkStringParameter(data.date, 'date');
  const time = checkStringParameter(data.time, 'time');
  const comment = checkStringOptionalParameter(data.comment, 'comment');

  const groupId = checkGroupId(locals);

  const account = await checkAccount(accountId, locals);
  const category = await checkCategory(categoryId, locals);

  const transaction = await db.transaction.create({
    data: {
      owner: { connect: { id: groupId } },
      account: { connect: { id: account.id } },
      category: { connect: { id: category.id } },
      date: new Date(join([date, time], 'T')),
      amount,
      comment,
    },
  });

  return transaction;
}
