import { withRequestHandlerMiddleware } from '#lib/server/index.js';
import { createToken, listTokens, revokeToken } from '#lib/server/api/v2/auth/index.js';
import { checkAuth } from '#lib/server/utils/index.js';

import type { RequestHandler } from './$types';

/** List active tokens */
export const GET = withRequestHandlerMiddleware<RequestHandler>(async ({ cookies, request }) => {
  const { uuid, token } = await checkAuth(cookies, request);
  const result = await listTokens(uuid, token);
  return Response.json(result);
});

/** Create a new token for scripts and external tools */
export const POST = withRequestHandlerMiddleware<RequestHandler>(async ({ cookies, request }) => {
  const { uuid } = await checkAuth(cookies, request);
  const result = await createToken(uuid);
  return Response.json(result);
});

/** Revoke a token */
export const DELETE = withRequestHandlerMiddleware<RequestHandler>(async ({ cookies, request }) => {
  const { uuid, token } = await checkAuth(cookies, request);
  const data = await request.json();
  const result = await revokeToken(data, uuid, token);
  return Response.json(result);
});
