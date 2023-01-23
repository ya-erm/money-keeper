import { json } from '@sveltejs/kit';

import { withRequestHandlerMiddleware } from '$lib/server';
import { getTags, createTag } from '$lib/server/api/tags';

import type { RequestHandler } from './$types';

export const GET = withRequestHandlerMiddleware<RequestHandler>(async ({ locals }) => {
  const result = await getTags(locals);
  return json(result);
});

export const POST = withRequestHandlerMiddleware<RequestHandler>(async ({ request, locals }) => {
  const data = await request.json();
  const result = await createTag(data, locals);
  return json(result);
});
