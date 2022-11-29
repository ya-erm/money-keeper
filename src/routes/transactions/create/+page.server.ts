import { db, withActionMiddleware } from '$lib/server';
import {
  checkNumberFormParameter,
  checkStringFormParameter,
  checkStringOptionalFormParameter,
} from '$lib/server/utils';
import { checkUserAndGroup, serialize } from '$lib/utils';

import { deps } from '$lib/deps';
import { createTransaction } from '$lib/server/api/transactions';
import { createTransfer } from '$lib/server/api/transactions/createTransfer';
import type { Action, Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, depends }) => {
  const { groupId } = checkUserAndGroup(locals, { redirect: true });

  const accounts = await db.account.findMany({
    where: { ownerId: groupId },
  });

  depends(deps.categories);
  const categories = await db.category.findMany({
    where: { ownerId: groupId },
  });

  return {
    accounts,
    categories,
  };
};

const create: Action = async ({ request, locals }) => {
  const data = await request.formData();

  if (data.get('destinationAccountId')) {
    const { t1, t2 } = await createTransfer(
      {
        source: {
          accountId: checkNumberFormParameter(data, 'accountId'),
          amount: checkNumberFormParameter(data, 'amount'),
        },
        destination: {
          accountId: checkNumberFormParameter(data, 'destinationAccountId'),
          amount: checkNumberFormParameter(data, 'destinationAmount'),
        },
        date: checkStringFormParameter(data, 'date'),
        time: checkStringFormParameter(data, 'time'),
        comment: checkStringOptionalFormParameter(data, 'comment'),
      },
      locals,
    );
    return {
      t1: serialize(t1),
      t2: serialize(t2),
    };
  }

  const transaction = await createTransaction(
    {
      accountId: checkNumberFormParameter(data, 'accountId'),
      categoryId: checkNumberFormParameter(data, 'categoryId'),
      amount: checkNumberFormParameter(data, 'amount'),
      date: checkStringFormParameter(data, 'date'),
      time: checkStringFormParameter(data, 'time'),
      comment: checkStringOptionalFormParameter(data, 'comment'),
    },
    locals,
  );

  return { transaction: serialize(transaction) };
};

export const actions: Actions = {
  create: withActionMiddleware(create),
};
