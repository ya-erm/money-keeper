import { redirect } from '@sveltejs/kit';
import bcrypt from 'bcrypt';

import { db } from '$lib/server/database';
import { apiError } from '$lib/server/apiError';
import type { Action, Actions, PageServerLoad } from './$types';
import { routes } from '$lib/routes';

export const load: PageServerLoad = async ({ locals }) => {
  // redirect user if logged in
  if (locals.user) {
    throw redirect(302, routes.profile.path);
  }
};

const register: Action = async ({ request }) => {
  const data = await request.formData();
  const name = data.get('name');
  const phone = data.get('phone');
  const password = data.get('password');

  if (
    typeof name !== 'string' ||
    typeof phone !== 'string' ||
    typeof password !== 'string' ||
    !name ||
    !phone ||
    !password
  ) {
    return apiError(400, 'BAD_REQUEST');
  }

  const user = await db.user.findUnique({
    where: { phone },
  });

  if (user) {
    return apiError(400, 'USER_ALREADY_EXISTS');
  }

  await db.user.create({
    data: {
      name,
      phone,
      password: {
        create: { hash: await bcrypt.hash(password, 10) },
      },
    },
  });

  throw redirect(302, routes.login.path);
};

export const actions: Actions = {
  register,
};
