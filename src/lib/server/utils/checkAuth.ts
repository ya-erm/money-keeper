import type { Cookies } from '@sveltejs/kit';

import { ApiError } from '$lib/api';
import { db } from '$lib/server';
import { SESSION_COOKIE_NAME, setSessionCookie } from '$lib/server/api/v2/auth/sessionCookie';

/**
 * Check session token
 * @returns member uuid
 * @throws error if token is not exists or invalidated
 */
export async function checkAuth(cookies: Cookies) {
  const session = cookies.get(SESSION_COOKIE_NAME);

  if (session) {
    const token = await db.memberToken.findFirst({
      where: { value: session },
    });
    if (token && !token.invalidated) {
      setSessionCookie(cookies, token.value);
      return { uuid: token.memberUuid };
    }
  }

  throw new ApiError(401, 'UNAUTHORIZED', 'You are not logged in');
}
