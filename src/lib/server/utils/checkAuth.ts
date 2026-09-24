import type { Cookies } from '@sveltejs/kit';

import { ApiError } from '$lib/api';
import { db } from '$lib/server';
import { SESSION_COOKIE_NAME, setSessionCookie } from '$lib/server/api/v2/auth/sessionCookie';

const BEARER_PREFIX = 'Bearer ';

/** Extract token from `Authorization: Bearer <token>` header */
function getBearerToken(request: Request | undefined) {
  const header = request?.headers.get('authorization');
  if (header?.startsWith(BEARER_PREFIX)) {
    return header.slice(BEARER_PREFIX.length).trim() || null;
  }
  return null;
}

/**
 * Check session token from cookie or from `Authorization: Bearer <token>` header.
 * The header is intended for scripts and external tools, the cookie for the browser.
 * @returns member uuid and the token value
 * @throws error if token is not exists or invalidated
 */
export async function checkAuth(cookies: Cookies, request?: Request) {
  const bearer = getBearerToken(request);
  const session = bearer ?? cookies.get(SESSION_COOKIE_NAME);

  if (session) {
    const token = await db.memberToken.findFirst({
      where: { value: session },
    });
    if (token && !token.invalidated) {
      if (!bearer) {
        // Prolong the cookie for browser sessions only
        setSessionCookie(cookies, token.value);
      }
      return { uuid: token.memberUuid, token: token.value };
    }
  }

  throw new ApiError(401, 'UNAUTHORIZED', 'You are not logged in');
}
