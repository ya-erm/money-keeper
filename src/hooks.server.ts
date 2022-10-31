import type { Handle } from '@sveltejs/kit';

import { db } from '$lib/server';

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

  try {
    // update last usage of token
    await db.authToken.update({
      where: { id: token.id },
      data: { lastUsage: new Date() },
    });
  } catch (e) {
    console.error('Failed to update field lastUsage of authToken', e);
  }

  const user = token?.user;

  // if `user` exists set `events.local`
  if (user) {
    event.locals.user = {
      id: user.id,
      login: user.login,
      name: user.name ?? `User #${user.id}`,
    };
  }

  // get selected group id from cookies
  const groupId = parseInt(event.cookies.get('groupId') ?? '');
  if (user && groupId && !Number.isNaN(groupId)) {
    const userInGroup = await db.userToGroup.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
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