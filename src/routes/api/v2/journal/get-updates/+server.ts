import { json } from '@sveltejs/kit';

import { withRequestHandlerMiddleware } from '$lib/server';
import { getJournal } from '$lib/server/api/v2/journal';
import { checkAuth } from '$lib/server/utils';

import type { RequestHandler } from './$types';

export const POST = withRequestHandlerMiddleware<RequestHandler>(async ({ request, cookies }) => {
  const { uuid } = await checkAuth(cookies);
  const data = await request.json();
  const result = await getJournal(data, uuid);
  return json(result);
});
