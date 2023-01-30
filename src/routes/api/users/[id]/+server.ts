import { json } from '@sveltejs/kit';

import { withRequestHandlerMiddleware } from '$lib/server';
import { updateUser } from '$lib/server/api/users';

import type { RequestHandler } from './$types';

export const PUT = withRequestHandlerMiddleware<RequestHandler>(async ({ params, request, locals, cookies }) => {
  const { id } = params;
  const data = await request.json();
  const result = await updateUser({ id: parseInt(id) }, data, locals, cookies);
  return json(result);
});
