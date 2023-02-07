import { json } from '@sveltejs/kit';

import { withRequestHandlerMiddleware } from '$lib/server';
import { getImportRules, createImportRule } from '$lib/server/api/importRules';

import type { RequestHandler } from './$types';

export const GET = withRequestHandlerMiddleware<RequestHandler>(async ({ locals }) => {
  const result = await getImportRules(locals);
  return json(result);
});

export const POST = withRequestHandlerMiddleware<RequestHandler>(async ({ request, locals }) => {
  const data = await request.json();
  const result = await createImportRule(data, locals);
  return json(result);
});
