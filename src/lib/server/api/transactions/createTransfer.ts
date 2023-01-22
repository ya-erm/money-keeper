import { ApiError } from '$lib/api';
import { db } from '$lib/server';
import {
  checkArrayOptionalParameter,
  checkNumberParameter,
  checkStringOptionalParameter,
  checkStringParameter,
  join,
} from '$lib/utils';
import { checkGroupId } from '$lib/utils/checkUser';
import { checkAccount } from '../accounts';
import { getOrCreateTransferInSystemCategory, getOrCreateTransferOutSystemCategory } from './utils';

export type CreateTransferRequestData = {
  source: {
    accountId: number;
    amount: number;
  };
  destination: {
    accountId: number;
    amount: number;
  };
  date: string;
  time: string;
  comment?: string | null;
  tags?: number[] | null;
};

export async function createTransfer(data: CreateTransferRequestData, locals: App.Locals) {
  const sourceAccountId = checkNumberParameter(data.source.accountId, 'sourceAccountId');
  const sourceAmount = checkNumberParameter(data.source.amount, 'sourceAmount');
  const destinationAccountId = checkNumberParameter(data.destination.accountId, 'destinationAccountId');
  const destinationAmount = checkNumberParameter(data.destination.amount, 'destinationAmount');
  const date = checkStringParameter(data.date, 'date');
  const time = checkStringParameter(data.time, 'time');
  const comment = checkStringOptionalParameter(data.comment, 'comment');
  const tags = checkArrayOptionalParameter<number>(data.tags, 'tags', { type: 'number', required: true });

  const groupId = checkGroupId(locals);

  if (sourceAccountId === destinationAccountId) {
    throw new ApiError(400, 'BAD_REQUEST', 'Source and destination accounts must be different');
  }

  const sourceAccount = await checkAccount(sourceAccountId, locals);
  const destinationAccount = await checkAccount(destinationAccountId, locals);

  const transferOutCategory = await getOrCreateTransferOutSystemCategory();
  const transferInCategory = await getOrCreateTransferInSystemCategory();

  const { t1, t2 } = await db.$transaction(async (tx) => {
    const t1 = await tx.transaction.create({
      data: {
        ownerId: groupId,
        accountId: sourceAccount.id,
        categoryId: transferOutCategory.id,
        date: new Date(join([date, time], 'T')),
        amount: sourceAmount,
        comment,
        tags: { connect: tags?.map((tagId) => ({ id: tagId })) },
      },
    });
    const t2 = await tx.transaction.create({
      data: {
        ownerId: groupId,
        accountId: destinationAccount.id,
        categoryId: transferInCategory.id,
        date: new Date(join([date, time], 'T')),
        amount: destinationAmount,
        comment,
        tags: { connect: tags?.map((tagId) => ({ id: tagId })) },
        linkedTransactionId: t1.id,
      },
    });
    const t1Updated = await tx.transaction.update({
      where: { id: t1.id },
      data: { linkedTransactionId: t2.id },
    });

    return { t1: t1Updated, t2 };
  });

  return { t1, t2 };
}
