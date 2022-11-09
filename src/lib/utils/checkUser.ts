import { error, redirect } from '@sveltejs/kit';

import { routes } from '$lib/routes';
import { db } from '$lib/server';
import { serverApiError } from '$lib/server/serverError';

type CheckOptions = {
  noRedirect: boolean;
};

/**
 * @throws redirect or throw error if user not logged in
 */
export const checkUser = (locals: App.Locals, { noRedirect }: CheckOptions = { noRedirect: false }) => {
  if (!locals.user) {
    throw noRedirect ? serverApiError(401, 'UNAUTHORIZED', 'You are not logged in') : redirect(302, routes.login.path);
  }

  return locals.user;
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
  const user = checkUser(locals, { noRedirect });
  const groupId = checkGroupId(locals, { noRedirect });

  const userInGroup = db.userToGroup.findUnique({
    where: {
      userId_groupId: {
        userId: user.id,
        groupId,
      },
    },
  });

  if (!userInGroup) {
    throw noRedirect
      ? serverApiError(403, 'FORBIDDEN', 'You have no access to this group')
      : redirect(302, routes.groups.path);
  }

  return {
    user,
    groupId,
  };
};
