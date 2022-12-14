import { json } from '@sveltejs/kit';

import { withRequestHandlerMiddleware } from '$lib/server';
import { deleteGroup, getGroupById } from '$lib/server/api/groups';

import type { RequestHandler } from './$types';

export const GET = withRequestHandlerMiddleware<RequestHandler>(async ({ params, locals }) => {
  const { id } = params;
  const data = await getGroupById({ id: parseInt(id) }, locals);
  return json(data);
});

export const DELETE = withRequestHandlerMiddleware<RequestHandler>(async ({ params, locals }) => {
  const { id } = params;
  await deleteGroup({ id: parseInt(id) }, locals);
  return json('OK');
});
