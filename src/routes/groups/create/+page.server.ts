import { redirect } from '@sveltejs/kit';

import { routes } from '$lib/routes';
import { db, serverError } from '$lib/server';

import type { Action, Actions, PageServerLoad } from './$types';
import { checkUserId } from '$lib/utils';

export const load: PageServerLoad = async ({ locals }) => {
  checkUserId(locals);
};

const create: Action = async ({ request, locals }) => {
  const data = await request.formData();
  const name = data.get('name');

  if (typeof name !== 'string' || !name) {
    return serverError(400, 'BAD_REQUEST', 'Name is required');
  }

  const userId = checkUserId(locals);

  await db.userToGroup.create({
    data: {
      user: {
        connect: { id: userId },
      },
      group: {
        create: {
          name,
        },
      },
    },
  });

  throw redirect(302, routes.groups.path);
};

export const actions: Actions = {
  create,
};
