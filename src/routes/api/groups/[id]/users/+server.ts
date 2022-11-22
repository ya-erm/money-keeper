import { json } from '@sveltejs/kit';

import { withRequestHandlerMiddleware } from '$lib/server';
import { addUserToGroup, deleteUserFromGroup } from '$lib/server/api/groups';

import type { RequestHandler } from './$types';

export const POST = withRequestHandlerMiddleware<RequestHandler>(async ({ params, request, locals }) => {
  const { id } = params;
  const data = await request.json();
  const result = await addUserToGroup({ id: parseInt(id) }, data, locals);
  return json(result);
});

export const DELETE = withRequestHandlerMiddleware<RequestHandler>(async ({ params, request, locals }) => {
  const { id } = params;
  const data = await request.json();
  const result = await deleteUserFromGroup({ id: parseInt(id) }, data, locals);
  return json(result);
});
