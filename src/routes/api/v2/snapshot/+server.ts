import { json } from '@sveltejs/kit';

import { withRequestHandlerMiddleware } from '$lib/server';
import { getSnapshot } from '$lib/server/api/v2/snapshot';
import { checkAuth } from '$lib/server/utils';

import type { RequestHandler } from './$types';

/** Current state of all entities, reduced from the journal on the server */
export const GET = withRequestHandlerMiddleware<RequestHandler>(async ({ cookies, request }) => {
  const { uuid } = await checkAuth(cookies, request);
  const result = await getSnapshot(uuid);
  return json(result);
});
