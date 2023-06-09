import type { Cookies } from '@sveltejs/kit';

import { ApiError } from '$lib/api';
import { db } from '$lib/server';

/**
 * Check session token
 * @returns member uuid
 * @throws error if token is not exists or invalidated
 */
export async function checkAuth(cookies: Cookies) {
  const session = cookies.get('session.v2');

  if (session) {
    const token = await db.memberToken.findFirst({
      where: { value: session },
    });
    if (token && !token.invalidated) {
      return { uuid: token.memberUuid };
    }
  }

  throw new ApiError(401, 'UNAUTHORIZED', 'You are not logged in');
}
