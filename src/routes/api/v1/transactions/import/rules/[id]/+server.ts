import { json } from '@sveltejs/kit';

import { withRequestHandlerMiddleware } from '$lib/server';
import { deleteImportRule, getImportRule, updateImportRule } from '$lib/server/api/importRules';

import type { RequestHandler } from './$types';

export const GET = withRequestHandlerMiddleware<RequestHandler>(async ({ params, locals }) => {
  const { id } = params;
  const data = await getImportRule({ id: parseInt(id) }, locals);
  return json(data);
});

export const PUT = withRequestHandlerMiddleware<RequestHandler>(async ({ params, request, locals }) => {
  const { id } = params;
  const data = await request.json();
  const result = await updateImportRule({ id: parseInt(id) }, data, locals);
  return json(result);
});

export const DELETE = withRequestHandlerMiddleware<RequestHandler>(async ({ params, locals }) => {
  const { id } = params;
  await deleteImportRule({ id: parseInt(id) }, locals);
  return json('OK');
});
