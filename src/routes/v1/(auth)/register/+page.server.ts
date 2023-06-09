import { redirect } from '@sveltejs/kit';

import { routes } from '$lib/routes';
import { withActionMiddleware } from '$lib/server';
import { register } from '$lib/server/api/auth';
import { checkStringFormParameter } from '$lib/server/utils';

import type { Action, Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // redirect user if logged in
  if (locals.userId) {
    throw redirect(302, routes.accounts.path);
  }
};

const registerAction: Action = async ({ request }) => {
  const data = await request.formData();
  const name = checkStringFormParameter(data, 'name');
  const login = checkStringFormParameter(data, 'login');
  const password = checkStringFormParameter(data, 'password');

  await register({ name, login, password });

  throw redirect(302, routes.login.path);
};

export const actions: Actions = {
  register: withActionMiddleware(registerAction),
};
