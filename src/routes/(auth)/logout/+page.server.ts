import { routes } from '$lib/routes';
import { db } from '$lib/server';
import { redirect } from '@sveltejs/kit';
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

  // eat the cookie
  cookies.set('session', '', {
    path: '/',
    expires: new Date(0),
  });

  // redirect the user
  throw redirect(302, routes.login.path);
};
