import { json } from '@sveltejs/kit';

import { withRequestHandlerMiddleware } from '$lib/server';
import { getJournal, postManyJournal } from '$lib/server/api/v2/journal';

import type { RequestHandler } from './$types';

export const GET = withRequestHandlerMiddleware<RequestHandler>(async ({ locals }) => {
  const result = await getJournal({ start: 0 }, locals);
  return json(result);
});

export const POST = withRequestHandlerMiddleware<RequestHandler>(async ({ request, locals }) => {
  const data = await request.json();
  const result = await postManyJournal(data, locals);
  return json(result);
});
