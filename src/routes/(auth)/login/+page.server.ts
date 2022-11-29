import { redirect } from '@sveltejs/kit';

import { routes } from '$lib/routes';
import { withActionMiddleware } from '$lib/server';
import { login } from '$lib/server/api/auth/login';
import { checkStringFormParameter } from '$lib/server/utils';

import type { Action, Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // redirect user if logged in
  if (locals.userId) {
    throw redirect(302, routes.profile.path);
  }
};

const loginAction: Action = async ({ request, cookies }) => {
  const formData = await request.formData();
  const data = {
    login: checkStringFormParameter(formData, 'login'),
    password: checkStringFormParameter(formData, 'password'),
  };

  await login(data, cookies);

  throw redirect(302, '/');
};

export const actions: Actions = {
  login: withActionMiddleware(loginAction),
};
