import type { Handle } from '@sveltejs/kit';

import { db } from '$lib/server';

export const handle: Handle = async ({ event, resolve }) => {
  const session = event.cookies.get('session');
  if (session) {
    const token = await db.authToken.findUnique({
      where: { value: session },
    });
    if (token && !token.invalidated) {
      event.locals.userId = token.userId;
      event.locals.groupId = token.groupId;
    }
  }

  const sessionV2 = event.cookies.get('session.v2');
  if (sessionV2) {
    const token = await db.memberToken.findFirst({
      where: { value: sessionV2 },
    });
    if (token && !token.invalidated) {
      event.locals.uuid = token.memberUuid;
    }
  }

  // load page as normal
  return await resolve(event);
};
