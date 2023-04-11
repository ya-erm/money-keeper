import { ApiError } from '$lib/api';
import { encryptRsa } from '$lib/data/crypto';
import { db } from '$lib/server';
import { checkStringParameter } from '$lib/utils';

export type LoginRequestData = {
  login: string;
};

export async function login(data: LoginRequestData) {
  const login = checkStringParameter(data.login, 'login');

  const member = await db.member.findFirst({ where: { login } });

  if (!member) {
    throw new ApiError(404, 'USER_NOT_FOUND', `User with login "${login}" not found`);
  }

  const publicKey = JSON.parse(member.publicKey) as JsonWebKey;
  const token = crypto.randomUUID();
  await db.memberToken.create({
    data: {
      value: token,
      memberUuid: member.uuid,
    },
  });
  const encryptedToken = await encryptRsa(publicKey, token);

  return { member, encryptedToken };
}

export type LoginResponseData = Awaited<ReturnType<typeof login>>;
