import { json } from '@sveltejs/kit';

import { withRequestHandlerMiddleware } from '$lib/server';
import { getTransactions } from '$lib/server/api/transactions';

import type { RequestHandler } from './$types';

export const GET = withRequestHandlerMiddleware<RequestHandler>(async ({ locals }) => {
  const result = await getTransactions({}, locals);
  return json(result);
});
