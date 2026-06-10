import type { Cookies } from '@sveltejs/kit';

export const SESSION_COOKIE_NAME = 'session.v2';
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function setSessionCookie(cookies: Cookies, token: string) {
  cookies.set(SESSION_COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_COOKIE_MAX_AGE,
  });
}
