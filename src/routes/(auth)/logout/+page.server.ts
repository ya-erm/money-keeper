import { redirect } from '@sveltejs/kit';

import { routes } from '$lib/routes';
import { logout } from '$lib/server/api/auth';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  await logout(locals, cookies);
  throw redirect(302, routes.login.path);
};
