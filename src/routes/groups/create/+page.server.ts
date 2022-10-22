import { redirect } from '@sveltejs/kit';

import { routes } from '$lib/routes';
import { db, serverError } from '$lib/server';

import type { Action, Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (e) => {
  if (!e.locals.user) {
    throw redirect(302, routes.login.path);
  }
};

const create: Action = async ({ request, locals }) => {
  const data = await request.formData();
  const name = data.get('name');

  if (!locals.user) {
    throw redirect(302, routes.login.path);
  }

  if (typeof name !== 'string' || !name) {
    return serverError(400, 'BAD_REQUEST', 'Name is required');
  }

  await db.userToGroup.create({
    data: {
      user: {
        connect: { id: locals.user.id },
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
