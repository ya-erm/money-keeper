import type { Cookies } from '@sveltejs/kit';

import { getValidSessionToken } from '$lib/server/api/v2/auth/token';

/**
 * Check session token
 * @returns member uuid
 * @throws error if token is not exists or invalidated
 */
export async function checkAuth(cookies: Cookies) {
  const token = await getValidSessionToken(cookies);
  return { uuid: token.memberUuid };
}
