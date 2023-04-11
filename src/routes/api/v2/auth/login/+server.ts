import { json } from '@sveltejs/kit';

import { withRequestHandlerMiddleware } from '$lib/server';
import { login, type LoginRequestData } from '$lib/server/api/v2/auth';

import type { RequestHandler } from './$types';

export const POST = withRequestHandlerMiddleware<RequestHandler>(async ({ request }) => {
  const data: LoginRequestData = await request.json();
  const result = await login(data);
  return json(result);
});
