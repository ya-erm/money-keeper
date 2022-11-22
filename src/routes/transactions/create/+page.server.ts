import { redirect } from '@sveltejs/kit';

import { routes } from '$lib/routes';
import { db, isServerError, serverError } from '$lib/server';
import {
  checkUserAndGroup,
  getNumberFormParameter,
  getStringOptionalFormParameter,
  getStringFormParameter,
} from '$lib/utils';

import type { Action, Actions, PageServerLoad } from './$types';
import { deps } from '$lib/deps';

export const load: PageServerLoad = async ({ url, locals, depends }) => {
  const { groupId } = checkUserAndGroup(locals, { redirect: true });

  const accounts = await db.account.findMany({
    where: { ownerId: groupId },
  });

  depends(deps.categories);
  const type = url.searchParams.get('type') ?? 'OUT';
  const categories = await db.category.findMany({
    where: { ownerId: groupId, type },
  });

  return {
    accounts,
    categories,
  };
};

const create: Action = async ({ request, locals }) => {
  try {
    const data = await request.formData();
    const accountId = getNumberFormParameter(data, 'accountId');
    const categoryId = getNumberFormParameter(data, 'categoryId');
    const amount = getNumberFormParameter(data, 'amount');
    const date = getStringFormParameter(data, 'date');
    const time = getStringFormParameter(data, 'time');
    const comment = getStringOptionalFormParameter(data, 'comment');

    const { groupId } = checkUserAndGroup(locals, { redirect: true });

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
        date: new Date(`${date}T${time}`),
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
