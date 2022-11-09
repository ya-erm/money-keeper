import type { Group, User, UserToGroup } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { error, redirect } from '@sveltejs/kit';

import type { GroupWithUsers } from '$lib/interfaces';
import { routes } from '$lib/routes';
import { db, isServerError, serverError } from '$lib/server';
import { checkUserId, getStringFormParameter } from '$lib/utils';

import type { Action, Actions, PageServerLoad, RouteParams } from './$types';

type GroupDbo = Pick<Group, 'id' | 'name'> & { users: (UserToGroup & { user: Pick<User, 'id' | 'name' | 'login'> })[] };

const selection = Prisma.validator<Prisma.GroupSelect>()({
  id: true,
  name: true,
  users: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          login: true,
        },
      },
    },
  },
});

const validate = async (params: RouteParams, locals: App.Locals) => {
  const groupId = parseInt(params.id);

  if (Number.isNaN(groupId)) {
    throw serverError(400, 'BAD_REQUEST');
  }

  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { id: true },
  });

  if (!group) {
    throw serverError(404, 'NOT_FOUND');
  }

  const userId = checkUserId(locals);

  const userInGroup = await db.userToGroup.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });

  if (!userInGroup) {
    throw serverError(403, 'FORBIDDEN');
  }

  return {
    userId,
    groupId,
  };
};

const mapGroup = (group: GroupDbo): GroupWithUsers => ({
  id: group.id,
  name: group.name,
  users: group.users.map(({ user }) => user),
});

export const load: PageServerLoad = async ({ params, locals }) => {
  try {
    const { groupId } = await validate(params, locals);

    const group = await db.group.findUniqueOrThrow({
      where: { id: groupId },
      select: selection,
    });

    return { group: mapGroup(group) };
  } catch (e) {
    if (isServerError(e)) throw error(e.status, e.data.error.code);
    throw e;
  }
};

const updateGroup: Action = async ({ params, request, locals }) => {
  try {
    const { groupId } = await validate(params, locals);

    const data = await request.formData();
    const name = getStringFormParameter(data, 'name');

    const group = await db.group.update({
      where: { id: groupId },
      data: {
        name,
      },
      select: selection,
    });

    return { group: mapGroup(group) };
  } catch (e) {
    if (isServerError(e)) return e;
    throw e;
  }
};

const deleteGroup: Action = async ({ params, locals }) => {
  try {
    const { groupId } = await validate(params, locals);

    await db.group.delete({ where: { id: groupId } });

    throw redirect(302, routes.groups.path);
  } catch (e) {
    if (isServerError(e)) return e;
    throw e;
  }
};

const addUser: Action = async ({ params, request, locals }) => {
  try {
    const { groupId } = await validate(params, locals);

    const data = await request.formData();
    const login = getStringFormParameter(data, 'login');

    const user = await db.user.findUnique({ where: { login } });

    if (!user) {
      return serverError(404, 'NOT_FOUND');
    }

    await db.userToGroup.create({
      data: { groupId, userId: user.id },
    });

    const group = await db.group.findUniqueOrThrow({
      where: { id: groupId },
      select: selection,
    });

    return { group: mapGroup(group) };
  } catch (e) {
    if (isServerError(e)) return e;
    throw e;
  }
};

export const actions: Actions = {
  updateGroup,
  deleteGroup,
  addUser,
};
