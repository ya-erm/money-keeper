import { json } from '@sveltejs/kit';

import { withRequestHandlerMiddleware } from '$lib/server';
import { compactJournal, getJournalStats } from '$lib/server/api/v2/journal';
import { checkAuth } from '$lib/server/utils';

import type { RequestHandler } from './$types';

/** Journal size */
export const GET = withRequestHandlerMiddleware<RequestHandler>(async ({ cookies, request }) => {
  const { uuid } = await checkAuth(cookies, request);
  const result = await getJournalStats(uuid);
  return json(result);
});

/** Replace the journal with a single snapshot item */
export const POST = withRequestHandlerMiddleware<RequestHandler>(async ({ cookies, request }) => {
  const { uuid } = await checkAuth(cookies, request);
  const data = await request.json();
  const result = await compactJournal(data, uuid);
  return json(result);
});
