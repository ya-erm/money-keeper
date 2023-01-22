import { json } from '@sveltejs/kit';

import { withRequestHandlerMiddleware } from '$lib/server';
import { deleteTag, getTag } from '$lib/server/api/tags';

import type { RequestHandler } from './$types';

export const GET = withRequestHandlerMiddleware<RequestHandler>(async ({ params, locals }) => {
  const { id } = params;
  const data = await getTag({ id: parseInt(id) }, locals);
  return json(data);
});

export const DELETE = withRequestHandlerMiddleware<RequestHandler>(async ({ params, locals }) => {
  const { id } = params;
  await deleteTag({ id: parseInt(id) }, locals);
  return json('OK');
});
