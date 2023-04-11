import { json } from '@sveltejs/kit';

import { withRequestHandlerMiddleware } from '$lib/server';
import { createCategory, getCategories } from '$lib/server/api/categories';

import type { RequestHandler } from './$types';

export const GET = withRequestHandlerMiddleware<RequestHandler>(async ({ locals }) => {
  const result = await getCategories(locals);
  return json(result);
});

export const POST = withRequestHandlerMiddleware<RequestHandler>(async ({ request, locals }) => {
  const data = await request.json();
  const result = await createCategory(data, locals);
  return json(result);
});
