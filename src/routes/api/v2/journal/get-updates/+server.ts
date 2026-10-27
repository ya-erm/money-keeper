import { withRequestHandlerMiddleware } from '#lib/server/index.js';
import { getJournal } from '#lib/server/api/v2/journal/index.js';
import { checkAuth } from '#lib/server/utils/index.js';

import type { RequestHandler } from './$types';

export const POST = withRequestHandlerMiddleware<RequestHandler>(async ({ request, cookies }) => {
  const { uuid } = await checkAuth(cookies, request);
  const data = await request.json();
  const result = await getJournal(data, uuid);
  return Response.json(result);
});
