import { json } from '@sveltejs/kit';

import { withRequestHandlerMiddleware } from '$lib/server';
import { createGroup, getGroups } from '$lib/server/api/groups';

import type { RequestHandler } from './$types';

export const GET = withRequestHandlerMiddleware<RequestHandler>(async ({ locals }) => {
  const result = await getGroups(locals);
  return json(result);
});

export const POST = withRequestHandlerMiddleware<RequestHandler>(async ({ request, locals }) => {
  const data = await request.json();
  const result = await createGroup(data, locals);
  return json(result);
});
