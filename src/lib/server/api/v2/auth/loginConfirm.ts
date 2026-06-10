import { ApiError } from '$lib/api';
import { db } from '$lib/server';
import type { Cookies } from '@sveltejs/kit';

import { checkStringParameter } from '$lib/utils';

import { setSessionCookie } from './token';

export type LoginConfirmRequestData = {
  uuid: string;
  token: string;
};

export async function loginConfirm(data: LoginConfirmRequestData, cookies: Cookies) {
  const uuid = checkStringParameter(data.uuid, 'uuid');
  const token = checkStringParameter(data.token, 'token');

  const memberToken = await db.memberToken.findFirst({
    where: {
      value: token,
      invalidated: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!memberToken || memberToken.memberUuid !== uuid) {
    throw new ApiError(401, 'UNAUTHORIZED', `Token "${token}" for user "${uuid}" not found`);
  }

  setSessionCookie(cookies, token, memberToken.expiresAt);

  return { tokenExpiresAt: memberToken.expiresAt.toISOString() };
}

export type LoginConfirmResponseData = Awaited<ReturnType<typeof loginConfirm>>;
