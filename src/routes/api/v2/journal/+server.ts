import { json } from '@sveltejs/kit';

import { withRequestHandlerMiddleware } from '$lib/server';
import { getJournal, postManyJournal } from '$lib/server/api/v2/journal';
import { checkAuth } from '$lib/server/utils';

import type { RequestHandler } from './$types';

export const GET = withRequestHandlerMiddleware<RequestHandler>(async ({ cookies, request }) => {
  const { uuid } = await checkAuth(cookies, request);
  const result = await getJournal({ start: 0 }, uuid);
  return json(result);
});

export const POST = withRequestHandlerMiddleware<RequestHandler>(async ({ request, cookies }) => {
  const { uuid } = await checkAuth(cookies, request);
  const data = await request.json();
  const result = await postManyJournal(data, uuid);
  return json(result);
});
