import type { Handle } from '@sveltejs/kit';

import { db } from '$lib/server';

export const handle: Handle = async ({ event, resolve }) => {
  // get cookies from browser
  const session = event.cookies.get('session');

  if (!session) {
    // if there is no session load page as normal
    return await resolve(event);
  }

  // TODO: to reduce number of db request we should use tokens witch includes all necessary information: userId, groupId

  // find token
  const token = await db.authToken.findUnique({
    where: { value: session },
  });

  if (!token || token?.invalidated) {
    return await resolve(event);
  }

  // put userId to `events.local`
  event.locals.userId = token.userId;

  // get selected group id from cookies
  const groupId = parseInt(event.cookies.get('groupId') ?? '');
  if (token.userId && groupId && !Number.isNaN(groupId)) {
    const userInGroup = await db.userToGroup.findUnique({
      where: {
        userId_groupId: {
          userId: token.userId,
          groupId: groupId,
        },
      },
    });
    event.locals.groupId = userInGroup ? groupId : null;
  } else {
    event.locals.groupId = null;
  }

  // load page as normal
  return await resolve(event);
};
