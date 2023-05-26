import { withRequestHandlerMiddleware } from '$lib/server';
import { register, type RegisterRequestData } from '$lib/server/api/auth';
import { json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const POST = withRequestHandlerMiddleware<RequestHandler>(async ({ request }) => {
  const data: RegisterRequestData = await request.json();
  await register(data);
  return json('OK');
});
