import { redirect } from '@sveltejs/kit';

import { routes } from '$lib/routes';
import { serverApiError } from '$lib/server/serverError';

type CheckOptions = {
  noRedirect: boolean;
};

/**
 * @throws redirect or throw error if user not logged in
 */
export const checkUserId = (locals: App.Locals, { noRedirect }: CheckOptions = { noRedirect: false }) => {
  if (!locals.userId) {
    throw noRedirect ? serverApiError(401, 'UNAUTHORIZED', 'You are not logged in') : redirect(302, routes.login.path);
  }

  return locals.userId;
};

/**
 * @throws redirect or throw error if group is not selected
 */
export const checkGroupId = (locals: App.Locals, { noRedirect }: CheckOptions = { noRedirect: false }) => {
  if (!locals.groupId) {
    throw noRedirect
      ? serverApiError(400, 'BAD_REQUEST', "Parameter 'groupId' is required")
      : redirect(302, routes.groups.path);
  }

  return locals.groupId;
};

/**
 * @throws redirect if user is not logged in or group is not selected
 */
export const checkUserAndGroup = (locals: App.Locals, { noRedirect }: CheckOptions = { noRedirect: false }) => {
  const userId = checkUserId(locals, { noRedirect });
  const groupId = checkGroupId(locals, { noRedirect });

  return {
    userId,
    groupId,
  };
};
