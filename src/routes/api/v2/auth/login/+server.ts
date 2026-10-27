import { withRequestHandlerMiddleware } from '#lib/server/index.js';
import { login, type LoginRequestData } from '#lib/server/api/v2/auth/index.js';

import type { RequestHandler } from './$types';

export const POST = withRequestHandlerMiddleware<RequestHandler>(async ({ request }) => {
  const data: LoginRequestData = await request.json();
  const result = await login(data);
  return Response.json(result);
});
