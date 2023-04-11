import { ApiError } from '$lib/api';
import { db } from '$lib/server';
import { checkStringOptionalParameter, checkStringParameter } from '$lib/utils';

export type RegisterRequestData = {
  uuid: string;
  login?: string;
  publicKey: string;
  encryptedKey: {
    version: string;
    salt: string;
    base64Data: string;
    initialVector: string;
  };
};

export async function register(data: RegisterRequestData) {
  const uuid = checkStringParameter(data.uuid, 'uuid');
  const login = checkStringOptionalParameter(data.login, 'login');
  const publicKey = checkStringParameter(data.publicKey, 'publicKey');
  const encryptedKey = data.encryptedKey;

  const user = await db.user.findFirst({
    where: { OR: { uuid, login: login ?? undefined } },
  });

  if (user) {
    throw new ApiError(400, 'USER_ALREADY_EXISTS', 'User already exists');
  }

  const member = await db.member.create({
    data: {
      uuid,
      login,
      publicKey,
      encryptedKey: JSON.stringify(encryptedKey),
    },
  });

  return member;
}

export type RegisterResponseData = Awaited<ReturnType<typeof register>>;
