import bcrypt from 'bcrypt';

import type { Cookies } from '@sveltejs/kit';

import { ApiError } from '$lib/api';
import { db } from '$lib/server';
import { checkStringParameter } from '$lib/utils';

export type LoginRequestData = {
  login: string;
  password: string;
};

export async function login(data: LoginRequestData, cookies: Cookies) {
  const login = checkStringParameter(data.login, 'login');
  const password = checkStringParameter(data.password, 'password');

  const user = await db.user.findUnique({
    where: { login },
    include: {
      password: { select: { hash: true } },
      groups: true,
    },
  });

  if (!user) {
    throw new ApiError(403, 'INCORRECT_LOGIN_OR_PASSWORD', 'Incorrect login or password');
  }

  const correctPassword = await bcrypt.compare(password, user.password?.hash ?? '');

  if (!correctPassword) {
    throw new ApiError(403, 'INCORRECT_LOGIN_OR_PASSWORD', 'Incorrect login or password');
  }

  const token = await db.authToken.create({
    data: {
      value: crypto.randomUUID(),
      userId: user.id,
      groupId: user.groups[0]?.groupId,
    },
  });

  cookies.set('session', token.value, {
    // send cookie for every page
    path: '/',
    // server side only cookie so you can't use `document.cookie`
    httpOnly: true,
    // only requests from same site can send cookies
    // https://developer.mozilla.org/en-US/docs/Glossary/CSRF
    sameSite: 'strict',
    // only sent over HTTPS in production
    secure: process.env.NODE_ENV === 'production',
    // set cookie to expire after a month
    maxAge: 60 * 60 * 24 * 30,
  });
}
