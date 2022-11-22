import { error, redirect } from '@sveltejs/kit';

import { isApiError } from '$lib/api/ApiError';
import { routes } from '$lib/routes';
import { withActionMiddleware } from '$lib/server';
import { addUserToGroup, deleteGroup, deleteUserFromGroup, getGroupById, updateGroup } from '$lib/server/api/groups';
import { checkUserId, getNumberFormParameter, getStringFormParameter } from '$lib/utils';

import type { Action, Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  checkUserId(locals, { redirect: true });
  try {
    const { id } = params;
    const group = await getGroupById({ id: parseInt(id) }, locals);
    return { group };
  } catch (e) {
    if (isApiError(e)) throw error(e.status, e.code);
    throw e;
  }
};

const updateGroupAction: Action = async ({ params, request, locals }) => {
  const { id } = params;
  const data = await request.formData();
  const name = getStringFormParameter(data, 'name');
  const group = await updateGroup({ id: parseInt(id) }, { name }, locals);
  return { group };
};

const deleteGroupAction: Action = async ({ params, locals }) => {
  const { id } = params;
  await deleteGroup({ id: parseInt(id) }, locals);
  throw redirect(302, routes.groups.path);
};

const addUserAction: Action = async ({ params, request, locals }) => {
  const { id } = params;
  const data = await request.formData();
  const login = getStringFormParameter(data, 'login');
  const group = await addUserToGroup({ id: parseInt(id) }, { login }, locals);
  return { group };
};

const deleteUserAction: Action = async ({ params, request, locals }) => {
  const { id } = params;
  const data = await request.formData();
  const userId = getNumberFormParameter(data, 'userId');
  const group = await deleteUserFromGroup({ id: parseInt(id) }, { userId }, locals);
  return { group };
};

export const actions: Actions = {
  updateGroup: withActionMiddleware(updateGroupAction),
  deleteGroup: withActionMiddleware(deleteGroupAction),
  addUser: withActionMiddleware(addUserAction),
  deleteUser: withActionMiddleware(deleteUserAction),
};
