import { redirect } from '@sveltejs/kit';

import { routes } from '$lib/routes';
import { db } from '$lib/server';

/**
 * @throws redirect if user not logged in
 */
export const checkUser = (locals: App.Locals) => {
  if (!locals.user) {
    throw redirect(302, routes.login.path);
  }

  return locals.user;
};

/**
 * @throws redirect if group is not selected
 */
export const checkGroupId = (locals: App.Locals) => {
  if (!locals.groupId) {
    throw redirect(302, routes.groups.path);
  }

  return locals.groupId;
};

/**
 * @throws redirect if user is not logged in or group is not selected
 */
export const checkUserAndGroup = (locals: App.Locals) => {
  const user = checkUser(locals);
  const groupId = checkGroupId(locals);

  const userInGroup = db.userToGroup.findUnique({
    where: {
      userId_groupId: {
        userId: user.id,
        groupId,
      },
    },
  });

  if (!userInGroup) {
    throw redirect(302, routes.groups.path);
  }

  return {
    user,
    groupId,
  };
};
