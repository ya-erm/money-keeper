import { redirect } from '@sveltejs/kit';

import { routes } from '$lib/routes';
import { db, isServerError } from '$lib/server';
import { checkUserId, checkUserAndGroup } from '$lib/utils';
import { checkStringOptionalFormParameter, checkStringFormParameter } from '$lib/server/utils';

import type { Action, Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  checkUserId(locals, { redirect: true });
};

const create: Action = async ({ request, locals }) => {
  try {
    const data = await request.formData();
    const name = checkStringFormParameter(data, 'name');
    const currency = checkStringFormParameter(data, 'currency');
    const icon = checkStringOptionalFormParameter(data, 'icon');
    const color = checkStringOptionalFormParameter(data, 'color');

    const { groupId } = checkUserAndGroup(locals, { redirect: true });

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
