import { error, redirect } from '@sveltejs/kit';

import { routes } from '$lib/routes';
import { db, isServerError, serverError } from '$lib/server';
import {
  checkUserAndGroup,
  getNumberFormParameter,
  getStringOptionalFormParameter,
  getStringFormParameter,
} from '$lib/utils';

import type { Action, Actions, PageServerLoad, RouteParams } from './$types';

const validate = async ({ params, locals }: { params: RouteParams; locals: App.Locals }) => {
  const { user, groupId } = checkUserAndGroup(locals);

  const transactionId = parseInt(params.id);

  if (Number.isNaN(transactionId)) {
    throw serverError(400, 'BAD_REQUEST');
  }

  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
    include: {
      account: true,
      category: true,
    },
  });

  if (!transaction) {
    throw serverError(404, 'NOT_FOUND');
  }

  if (transaction.ownerId !== groupId) {
    throw serverError(403, 'FORBIDDEN');
  }

  return {
    user,
    groupId,
    transactionId,
    transaction,
  };
};

export const load: PageServerLoad = async ({ params, locals }) => {
  try {
    const { groupId, transaction } = await validate({ params, locals });

    const accounts = await db.account.findMany({
      where: { ownerId: groupId },
    });

    const categories = await db.category.findMany({
      where: { ownerId: groupId },
    });

    return {
      accounts,
      categories,
      transaction,
    };
  } catch (e) {
    if (isServerError(e)) throw error(e.status, e.data.error.code);
    throw e;
  }
};

const updateTransaction: Action = async ({ params, request, locals }) => {
  try {
    const { groupId, transactionId } = await validate({ params, locals });

    const data = await request.formData();
    const accountId = getNumberFormParameter(data, 'accountId');
    const categoryId = getNumberFormParameter(data, 'categoryId');
    const amount = getNumberFormParameter(data, 'amount');
    const date = getStringFormParameter(data, 'date');
    const comment = getStringOptionalFormParameter(data, 'comment');

    await db.transaction.update({
      where: { id: transactionId },
      data: {
        owner: { connect: { id: groupId } },
        account: { connect: { id: accountId } },
        category: { connect: { id: categoryId } },
        date: new Date(date),
        amount,
        comment,
      },
      include: {
        account: true,
        category: true,
      },
    });

    throw redirect(302, routes.transactions.path);
  } catch (e) {
    if (isServerError(e)) return e;
    throw e;
  }
};

const deleteTransaction: Action = async ({ params, locals }) => {
  try {
    const { transactionId } = await validate({ params, locals });

    await db.transaction.delete({
      where: { id: transactionId },
    });

    throw redirect(302, routes.transactions.path);
  } catch (e) {
    if (isServerError(e)) return e;
    throw e;
  }
};

export const actions: Actions = {
  update: updateTransaction,
  delete: deleteTransaction,
};
