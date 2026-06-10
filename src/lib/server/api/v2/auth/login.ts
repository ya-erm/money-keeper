import { ApiError } from '$lib/api';
import { encryptRsa } from '$lib/data/crypto';
import { db } from '$lib/server';
import { checkStringParameter } from '$lib/utils';

import { createMemberToken } from './token';

export type LoginRequestData = {
  login: string;
};

export async function login(data: LoginRequestData) {
  const login = checkStringParameter(data.login, 'login');

  const member = await db.member.findFirst({ where: { login } });

  if (!member) {
    throw new ApiError(404, 'USER_NOT_FOUND', `User with login "${login}" not found`);
  }

  const memberToken = await createMemberToken(member.uuid);

  const publicKey = JSON.parse(member.publicKey) as JsonWebKey;
  const encryptedToken = await encryptRsa(publicKey, memberToken.value);

  return { member, encryptedToken };
}

export type LoginResponseData = Awaited<ReturnType<typeof login>>;
