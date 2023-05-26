import { routes } from '$lib/routes';
import { checkUserAndGroup } from '$lib/utils';
import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from '../$types';

export const load: PageServerLoad = async ({ locals }) => {
  checkUserAndGroup(locals, { redirect: true });
  throw redirect(302, routes.accounts.path);
};
