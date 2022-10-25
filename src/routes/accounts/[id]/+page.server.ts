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

const selection = {
  id: true,
  name: true,
  currency: true,
  color: true,
  icon: true,
  ownerId: true,
};

export const load: PageServerLoad = async ({ params, locals }) => {
  const { groupId } = checkUserAndGroup(locals);

  const id = parseInt(params.id);

  if (Number.isNaN(id)) {
    return serverError(400, 'BAD_REQUEST');
  }

  const account = await db.account.findUnique({
    where: { id },
    select: selection,
  });

  if (!account) {
    return serverError(404, 'NOT_FOUND');
  }

  if (account.ownerId !== groupId) {
    return serverError(403, 'FORBIDDEN');
  }

  return { account };
};

const updateAccount: Action = async ({ request, locals }) => {
  const { groupId } = checkUserAndGroup(locals);
  try {
    const data = await request.formData();
    const id = getNumberParameterOrThrow(data, 'id');
    const name = getStringParameterOrThrow(data, 'name');
    const currency = getStringParameterOrThrow(data, 'currency');
    const icon = getStringOptionalParameterOrThrow(data, 'icon');
    const color = getStringOptionalParameterOrThrow(data, 'color');

    const account = await db.account.findUnique({
      where: { id },
    });

    if (!account) {
      return serverError(404, 'NOT_FOUND');
    }

    if (account.ownerId !== groupId) {
      return serverError(403, 'FORBIDDEN');
    }

    await db.account.update({
      where: { id },
      data: {
        name,
        currency,
        color,
        icon,
      },
      select: selection,
    });

    throw redirect(302, `${routes.accounts.path}#account-card-${account.id}`);
  } catch (e) {
    if (isServerError(e)) return e;
    throw e;
  }
};

const deleteAccount: Action = async ({ request, locals }) => {
  const { groupId } = checkUserAndGroup(locals);
  try {
    const data = await request.formData();
    const id = getNumberParameterOrThrow(data, 'id');

    const account = await db.account.findUnique({ where: { id } });

    if (!account) {
      return serverError(404, 'NOT_FOUND');
    }

    if (account.ownerId !== groupId) {
      return serverError(403, 'FORBIDDEN');
    }

    await db.account.delete({
      where: { id },
    });

    throw redirect(302, routes.accounts.path);
  } catch (e) {
    if (isServerError(e)) return e;
    throw e;
  }
};

export const actions: Actions = {
  updateAccount,
  deleteAccount,
};
