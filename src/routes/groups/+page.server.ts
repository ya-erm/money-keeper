import { redirect } from '@sveltejs/kit';

import { routes } from '$lib/routes';
import { withActionMiddleware } from '$lib/server';
import { getGroups, selectGroup } from '$lib/server/api/groups';
import { checkNumberFormParameter } from '$lib/server/utils';
import { checkUserId } from '$lib/utils';

import type { Action, Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  checkUserId(locals, { redirect: true });
  return await getGroups(locals);
};

const selectGroupAction: Action = async ({ request, locals, cookies }) => {
  const data = await request.formData();
  const groupId = checkNumberFormParameter(data, 'groupId');

  await selectGroup({ groupId }, locals, cookies);

  throw redirect(302, `${routes.groups.path}/${groupId}`);
};

export const actions: Actions = {
  selectGroup: withActionMiddleware(selectGroupAction),
};
