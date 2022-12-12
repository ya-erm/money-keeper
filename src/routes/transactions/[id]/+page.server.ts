import { error } from '@sveltejs/kit';

import { isApiError } from '$lib/api/ApiError';
import { deps } from '$lib/deps';
import { db, withActionMiddleware } from '$lib/server';
import { deleteTransaction, getTransaction, updateTransaction } from '$lib/server/api/transactions';
import {
  checkNumberFormParameter,
  checkStringFormParameter,
  checkStringOptionalFormParameter,
} from '$lib/server/utils';
import { serialize } from '$lib/utils';
import { checkGroupId } from '$lib/utils/checkUser';

import type { Action, Actions, PageServerLoad } from './$types';
import { updateTransfer } from '$lib/server/api/transactions/updateTransfer';

export const load: PageServerLoad = async ({ params, locals, depends }) => {
  try {
    const groupId = checkGroupId(locals);
    const transaction = await getTransaction({ id: parseInt(params.id) }, locals);

    // TODO: use API
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
      transaction,
    };
  } catch (e) {
    if (isApiError(e)) throw error(e.status, e.code);
    throw e;
  }
};

const updateTransactionAction: Action = async ({ params, request, locals }) => {
  const data = await request.formData();

  if (data.get('destinationAccountId')) {
    const { t1, t2 } = await updateTransfer(
      { id: parseInt(params.id) },
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

  const updatedTransaction = await updateTransaction(
    { id: parseInt(params.id) },
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

  return { transaction: serialize(updatedTransaction) };
};

const deleteTransactionAction: Action = async ({ params, locals }) => {
  await deleteTransaction({ id: parseInt(params.id) }, locals);
  return null;
};

export const actions: Actions = {
  update: withActionMiddleware(updateTransactionAction),
  delete: withActionMiddleware(deleteTransactionAction),
};
