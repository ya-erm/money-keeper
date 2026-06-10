import { json } from '@sveltejs/kit';

import { withRequestHandlerMiddleware } from '$lib/server';
import { refreshToken } from '$lib/server/api/v2/auth';

import type { RequestHandler } from './$types';

export const POST = withRequestHandlerMiddleware<RequestHandler>(async ({ cookies }) => {
  const result = await refreshToken(cookies);
  return json(result);
});
