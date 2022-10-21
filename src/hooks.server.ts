import type { Handle } from '@sveltejs/kit';
import { db } from '$lib/server/database';

export const handle: Handle = async ({ event, resolve }) => {
  // get cookies from browser
  const session = event.cookies.get('session');

  if (!session) {
    // if there is no session load page as normal
    return await resolve(event);
  }

  // find token
  const token = await db.authToken.findUnique({
    where: { value: session },
    include: { user: true },
  });

  if (!token || token?.invalidated) {
    return await resolve(event);
  }

  // update last usage of token
  await db.authToken.update({
    where: { id: token.id },
    data: { lastUsage: new Date() },
  });

  const user = token?.user;

  // if `user` exists set `events.local`
  if (user) {
    event.locals.user = {
      id: user.id,
      name: user.name ?? `User #${user.id}`,
    };
  }

  // load page as normal
  return await resolve(event);
};
