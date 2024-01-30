import type { Handle } from '@sveltejs/kit';

import { db } from '$lib/server';

export const handle: Handle = async ({ event, resolve }) => {
  try {
    const sessionV2 = event.cookies.get('session.v2');
    if (sessionV2) {
      const token = await db.memberToken.findFirst({
        where: { value: sessionV2 },
      });
      if (token && !token.invalidated) {
        event.locals.uuid = token.memberUuid;
      }
    }
  } catch (e) {
    // TODO: let client know that server has problem
    console.error('[hooks.server.ts]', e);
  }

  return await resolve(event);
};
