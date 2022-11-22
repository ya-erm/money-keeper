import { redirect } from '@sveltejs/kit';

import { routes } from '$lib/routes';
import { withActionMiddleware } from '$lib/server';
import { createGroup } from '$lib/server/api/groups';
import { checkUserId, getStringFormParameter } from '$lib/utils';

import type { Action, Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  checkUserId(locals, { redirect: true });
};

const create: Action = async ({ request, locals }) => {
  const data = await request.formData();
  const name = getStringFormParameter(data, 'name');

  await createGroup({ name }, locals);

  throw redirect(302, routes.groups.path);
};

export const actions: Actions = {
  create: withActionMiddleware(create),
};
