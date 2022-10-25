import { redirect } from '@sveltejs/kit';

import { routes } from '$lib/routes';
import { db } from '$lib/server';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, locals }) => {
  // we only use this endpoint for the api
  // and don't need to see the page
  const session = cookies.get('session');

  // invalidate token
  if (session) {
    await db.authToken.update({
      where: { value: session },
      data: { invalidated: true },
    });
  }

  // clear locals
  locals.user = null;
  locals.groupId = null;

  // eat the cookies
  cookies.delete('session');
  cookies.delete('groupId');

  // redirect the user
  throw redirect(302, routes.login.path);
};
