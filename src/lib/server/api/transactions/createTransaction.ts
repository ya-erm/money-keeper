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

export type CreateTransactionRequestData = {
  accountId: number;
  categoryId: number;
  amount: number;
  dateTime: string;
  comment?: string | null;
  tags?: number[] | null;
};

export async function createTransaction(data: CreateTransactionRequestData, locals: App.Locals) {
  const accountId = checkNumberParameter(data.accountId, 'accountId');
  const categoryId = checkNumberParameter(data.categoryId, 'categoryId');
  const amount = checkNumberParameter(data.amount, 'amount');
  const dateTime = checkStringParameter(data.dateTime, 'dateTime');
  const comment = checkStringOptionalParameter(data.comment, 'comment');
  const tags = checkArrayOptionalParameter<number>(data.tags, 'tags', { type: 'number', required: true });

  const groupId = checkGroupId(locals);

  const account = await checkAccount(accountId, locals);
  const category = await checkCategory(categoryId, locals);

  const transaction = await db.transaction.create({
    data: {
      owner: { connect: { id: groupId } },
      account: { connect: { id: account.id } },
      category: { connect: { id: category.id } },
      date: dateTime,
      amount,
      comment,
      tags: { connect: tags?.map((tagId) => ({ id: tagId })) },
    },
  });

  return transaction;
}
