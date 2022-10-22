import { redirect } from '@sveltejs/kit';
import bcrypt from 'bcrypt';

import { db, serverError } from '$lib/server';
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
  const login = data.get('login');
  const password = data.get('password');

  if (
    typeof name !== 'string' ||
    typeof login !== 'string' ||
    typeof password !== 'string' ||
    !name ||
    !login ||
    !password
  ) {
    return serverError(400, 'BAD_REQUEST');
  }

  const user = await db.user.findUnique({
    where: { login },
  });

  if (user) {
    return serverError(400, 'USER_ALREADY_EXISTS');
  }

  await db.user.create({
    data: {
      name,
      login,
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
