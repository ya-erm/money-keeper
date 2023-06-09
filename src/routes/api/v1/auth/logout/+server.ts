import { json } from '@sveltejs/kit';

import { withRequestHandlerMiddleware } from '$lib/server';
import { logout } from '$lib/server/api/auth';

import type { RequestHandler } from './$types';

export const POST = withRequestHandlerMiddleware<RequestHandler>(async ({ locals, cookies }) => {
  await logout(locals, cookies);
  return json('OK');
});
