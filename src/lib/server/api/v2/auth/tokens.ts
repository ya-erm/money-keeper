import { ApiError } from '$lib/api';
import { db } from '$lib/server';
import { checkStringParameter } from '$lib/utils';

/** Length of the token prefix that is exposed to the client as an identifier */
const TOKEN_ID_LENGTH = 8;

export type TokenInfo = {
  /** First characters of the token, enough to identify it */
  id: string;
  createdAt: string;
  /** Token is used by the current request */
  current: boolean;
};

export type ListTokensResponseData = { tokens: TokenInfo[] };

/** List active tokens of the member */
export async function listTokens(uuid: string, currentToken: string): Promise<ListTokensResponseData> {
  const tokens = await db.memberToken.findMany({
    where: { memberUuid: uuid, invalidated: false },
    orderBy: { createdAt: 'asc' },
  });
  return {
    tokens: tokens.map((token) => ({
      id: token.value.slice(0, TOKEN_ID_LENGTH),
      createdAt: token.createdAt.toISOString(),
      current: token.value === currentToken,
    })),
  };
}

export type CreateTokenResponseData = { token: string };

/** Create a new token, its full value is returned only once */
export async function createToken(uuid: string): Promise<CreateTokenResponseData> {
  const token = await db.memberToken.create({
    data: {
      value: crypto.randomUUID(),
      memberUuid: uuid,
    },
  });
  return { token: token.value };
}

export type RevokeTokenRequestData = { id: string };

/** Invalidate a token by its identifier (prefix) */
export async function revokeToken(data: RevokeTokenRequestData, uuid: string, currentToken: string) {
  const id = checkStringParameter(data.id, 'id');

  if (currentToken.startsWith(id)) {
    throw new ApiError(400, 'BAD_REQUEST', 'Token of the current session can not be revoked');
  }

  const result = await db.memberToken.updateMany({
    where: { memberUuid: uuid, invalidated: false, value: { startsWith: id } },
    data: { invalidated: true },
  });

  if (result.count === 0) {
    throw new ApiError(404, 'NOT_FOUND', `Token "${id}" not found`);
  }

  return { revoked: result.count };
}

export type RevokeTokenResponseData = Awaited<ReturnType<typeof revokeToken>>;
