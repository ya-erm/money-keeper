import { redirect } from '@sveltejs/kit';

import { routes } from '$lib/routes';
import { db, isServerError } from '$lib/server';
import { checkUserAndGroup, getStringOptionalParameterOrThrow, getStringParameterOrThrow } from '$lib/utils';

import type { Action, Actions } from './$types';

const create: Action = async ({ request, locals }) => {
  try {
    const data = await request.formData();
    const type = getStringParameterOrThrow(data, 'type');
    const name = getStringParameterOrThrow(data, 'name');
    const icon = getStringOptionalParameterOrThrow(data, 'icon');

    const { groupId } = checkUserAndGroup(locals);

    await db.category.create({
      data: {
        name,
        icon,
        type,
        owner: { connect: { id: groupId } },
      },
      select: {
        id: true,
        name: true,
        icon: true,
        order: true,
        type: true,
      },
    });

    throw redirect(302, routes.categories.path);
  } catch (e) {
    if (isServerError(e)) return e;
    throw e;
  }
};

export const actions: Actions = {
  create,
};
