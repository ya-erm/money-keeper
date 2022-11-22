import { json } from '@sveltejs/kit';

import { withRequestHandlerMiddleware } from '$lib/server';
import { login, type LoginRequestData } from '$lib/server/api/auth/login';

import type { RequestHandler } from './$types';

export const POST = withRequestHandlerMiddleware<RequestHandler>(async ({ request, cookies }) => {
  const data: LoginRequestData = await request.json();
  await login(data, cookies);
  return json('OK');
});
