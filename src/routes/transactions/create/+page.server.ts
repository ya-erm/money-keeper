import { redirect } from '@sveltejs/kit';

import { routes } from '$lib/routes';
import { db, isServerError, serverError } from '$lib/server';
import {
  checkUserAndGroup,
  getNumberParameterOrThrow,
  getStringOptionalParameterOrThrow,
  getStringParameterOrThrow,
} from '$lib/utils';

import type { Action, Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { groupId } = checkUserAndGroup(locals);

  const accounts = await db.account.findMany({
    where: { ownerId: groupId },
  });

  const categories = await db.category.findMany({
    where: { ownerId: groupId },
  });

  return {
    accounts,
    categories,
  };
};

const create: Action = async ({ request, locals }) => {
  try {
    const data = await request.formData();
    const accountId = getNumberParameterOrThrow(data, 'accountId');
    const categoryId = getNumberParameterOrThrow(data, 'categoryId');
    const amount = getNumberParameterOrThrow(data, 'amount');
    const date = getStringParameterOrThrow(data, 'date');
    const comment = getStringOptionalParameterOrThrow(data, 'comment');

    const { groupId } = checkUserAndGroup(locals);

    const account = await db.account.findUnique({ where: { id: accountId } });

    if (account?.ownerId !== groupId) {
      throw serverError(403, 'FORBIDDEN');
    }

    const category = await db.category.findUnique({ where: { id: categoryId } });

    if (category?.ownerId !== groupId) {
      throw serverError(403, 'FORBIDDEN');
    }

    await db.transaction.create({
      data: {
        owner: { connect: { id: groupId } },
        account: { connect: { id: accountId } },
        category: { connect: { id: categoryId } },
        date: new Date(date),
        amount,
        comment,
      },
    });

    throw redirect(302, `${routes.transactions.path}`);
  } catch (e) {
    if (isServerError(e)) return e;
    throw e;
  }
};

export const actions: Actions = {
  create,
};
