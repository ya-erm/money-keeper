import { withRequestHandlerMiddleware } from '#lib/server/index.js';
import { getSnapshot } from '#lib/server/api/v2/snapshot/index.js';
import { checkAuth } from '#lib/server/utils/index.js';

import type { RequestHandler } from './$types';

/** Current state of all entities, reduced from the journal on the server */
export const GET = withRequestHandlerMiddleware<RequestHandler>(async ({ cookies, request }) => {
  const { uuid } = await checkAuth(cookies, request);
  const result = await getSnapshot(uuid);
  return Response.json(result);
});
