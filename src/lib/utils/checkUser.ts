import { redirect } from '@sveltejs/kit';

import { ApiError } from '$lib/api';
import { routes } from '$lib/routes';

type CheckOptions = {
  redirect: boolean;
};

/**
 * @throws redirect or throw error if user not logged in
 */
export const checkUserId = (locals: App.Locals, options: CheckOptions = { redirect: false }) => {
  if (!locals.userId) {
    throw options.redirect
      ? redirect(302, routes.login.path)
      : new ApiError(401, 'UNAUTHORIZED', 'You are not logged in');
  }

  return locals.userId;
};

/**
 * @throws redirect or throw error if group is not selected
 */
export const checkGroupId = (locals: App.Locals, options: CheckOptions = { redirect: false }) => {
  if (!locals.groupId) {
    throw options.redirect
      ? redirect(302, routes.groups.path)
      : new ApiError(400, 'BAD_REQUEST', "Parameter 'groupId' is required");
  }

  return locals.groupId;
};

/**
 * @throws redirect if user is not logged in or group is not selected
 */
export const checkUserAndGroup = (locals: App.Locals, options: CheckOptions = { redirect: false }) => {
  const userId = checkUserId(locals, options);
  const groupId = checkGroupId(locals, options);

  return {
    userId,
    groupId,
  };
};
