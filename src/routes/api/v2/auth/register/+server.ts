import { withRequestHandlerMiddleware } from '#lib/server/index.js';
import { register, type RegisterRequestData } from '#lib/server/api/v2/auth/register.js';

import type { RequestHandler } from './$types';

export const POST = withRequestHandlerMiddleware<RequestHandler>(async ({ request }) => {
  const data: RegisterRequestData = await request.json();
  await register(data);
  return Response.json('OK');
});
