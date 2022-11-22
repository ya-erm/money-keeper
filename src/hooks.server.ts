import type { Handle } from '@sveltejs/kit';

import { db } from '$lib/server';

export const handle: Handle = async ({ event, resolve }) => {
  // get cookies from browser
  const session = event.cookies.get('session');

  if (!session || event.routeId?.endsWith('/logout')) {
    // if there is no session load page as normal
    return await resolve(event);
  }

  // find token
  const token = await db.authToken.findUnique({
    where: { value: session },
  });

  if (!token || token?.invalidated) {
    return await resolve(event);
  }

  // put userId to `event.locals`
  event.locals.userId = token.userId;
  event.locals.groupId = token.groupId;

  // load page as normal
  return await resolve(event);
};
