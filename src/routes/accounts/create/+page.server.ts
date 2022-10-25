import { redirect } from '@sveltejs/kit';

import { routes } from '$lib/routes';
import { db, isServerError } from '$lib/server';
import { checkUser, checkUserAndGroup, getStringOptionalParameterOrThrow, getStringParameterOrThrow } from '$lib/utils';

import type { Action, Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  checkUser(locals);
};

const create: Action = async ({ request, locals }) => {
  try {
    const data = await request.formData();
    const name = getStringParameterOrThrow(data, 'name');
    const currency = getStringParameterOrThrow(data, 'currency');
    const icon = getStringOptionalParameterOrThrow(data, 'icon');
    const color = getStringOptionalParameterOrThrow(data, 'color');

    const { groupId } = checkUserAndGroup(locals);

    const account = await db.account.create({
      data: {
        name,
        currency,
        icon,
        color,
        owner: { connect: { id: groupId } },
      },
    });

    throw redirect(302, `${routes.accounts.path}#account-card-${account.id}`);
  } catch (e) {
    if (isServerError(e)) return e;
    throw e;
  }
};

export const actions: Actions = {
  create,
};
