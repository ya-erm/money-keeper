import type { Cookies } from '@sveltejs/kit';

import { createMemberToken, getValidSessionToken, setSessionCookie } from './token';

export async function refreshToken(cookies: Cookies) {
  const currentToken = await getValidSessionToken(cookies);
  const newToken = await createMemberToken(currentToken.memberUuid);

  setSessionCookie(cookies, newToken.value, newToken.expiresAt);

  return { tokenExpiresAt: newToken.expiresAt.toISOString() };
}

export type RefreshTokenResponseData = Awaited<ReturnType<typeof refreshToken>>;
