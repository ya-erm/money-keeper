import { withRequestHandlerMiddleware } from '#lib/server/index.js';
import { loginConfirm, type LoginConfirmRequestData } from '#lib/server/api/v2/auth/index.js';

import type { RequestHandler } from './$types';

export const POST = withRequestHandlerMiddleware<RequestHandler>(async ({ request, cookies }) => {
  const data: LoginConfirmRequestData = await request.json();
  const result = await loginConfirm(data, cookies);
  return Response.json(result);
});
