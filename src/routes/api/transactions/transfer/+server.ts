import { json } from '@sveltejs/kit';

import { withRequestHandlerMiddleware } from '$lib/server';
import { createTransfer } from '$lib/server/api/transactions';

import type { RequestHandler } from './$types';

export const POST = withRequestHandlerMiddleware<RequestHandler>(async ({ request, locals }) => {
  const data = await request.json();
  await createTransfer(data, locals);
  return json('OK');
});
