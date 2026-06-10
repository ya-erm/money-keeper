import type { Cookies } from '@sveltejs/kit';

import { SESSION_COOKIE_NAME, TOKEN_TTL_MS } from '$lib/auth/session';
import { ApiError } from '$lib/api';
import { db } from '$lib/server';

export function getTokenExpiresAt(now = new Date()) {
  return new Date(now.getTime() + TOKEN_TTL_MS);
}

export function setSessionCookie(cookies: Cookies, token: string, expiresAt: Date) {
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));

  cookies.set(SESSION_COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge,
  });
}

export async function createMemberToken(memberUuid: string) {
  return await db.memberToken.create({
    data: {
      value: crypto.randomUUID(),
      memberUuid,
      expiresAt: getTokenExpiresAt(),
    },
  });
}

export async function getValidSessionToken(cookies: Cookies) {
  const session = cookies.get(SESSION_COOKIE_NAME);

  if (!session) {
    throw new ApiError(401, 'UNAUTHORIZED', 'You are not logged in');
  }

  const token = await db.memberToken.findFirst({
    where: {
      value: session,
      invalidated: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!token) {
    throw new ApiError(401, 'UNAUTHORIZED', 'You are not logged in');
  }

  return token;
}
