import { json } from '@sveltejs/kit';

import { withRequestHandlerMiddleware } from '$lib/server';
import { loginConfirm, type LoginConfirmRequestData } from '$lib/server/api/v2/auth';

import type { RequestHandler } from './$types';

export const POST = withRequestHandlerMiddleware<RequestHandler>(async ({ request, cookies }) => {
  const data: LoginConfirmRequestData = await request.json();
  const result = await loginConfirm(data, cookies);
  return json(result);
});
