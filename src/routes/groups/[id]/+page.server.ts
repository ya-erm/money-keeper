import { redirect } from '@sveltejs/kit';

import { routes } from '$lib/routes';
import { db, serverError } from '$lib/server';

import type { Action, Actions, PageServerLoad } from './$types';
import type { GroupWithUsers } from './interface';

const selection = {
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
};

export const load: PageServerLoad = async ({ params, locals }) => {
  if (!locals.user) {
    throw redirect(302, routes.login.path);
  }

  const id = parseInt(params.id);

  if (Number.isNaN(id)) {
    return serverError(400, 'BAD_REQUEST');
  }

  const group = await db.group.findUnique({
    where: { id },
    select: selection,
  });

  if (!group) {
    return serverError(404, 'NOT_FOUND');
  }

  const groupDto: GroupWithUsers = {
    id: group.id,
    name: group.name,
    users: group.users.map(({ user }) => user),
  };

  return { group: groupDto };
};

const updateGroup: Action = async ({ params, request }) => {
  const data = await request.formData();
  const name = data.get('name');

  if (typeof name !== 'string' || !name) {
    return serverError(400, 'BAD_REQUEST');
  }

  const id = parseInt(params.id);

  const group = await db.group.update({
    where: { id },
    data: {
      name,
    },
    select: selection,
  });

  const groupDto: GroupWithUsers = {
    id: group.id,
    name: group.name,
    users: group.users.map(({ user }) => user),
  };

  return { group: groupDto };

  throw redirect(302, `${routes.groups.path}/${id}`);
};

const deleteGroup: Action = async ({ params }) => {
  const id = parseInt(params.id);

  await db.group.delete({ where: { id } });

  throw redirect(302, routes.groups.path);
};

const addUser: Action = async ({ params, request }) => {
  const id = parseInt(params.id);

  if (Number.isNaN(id)) {
    return serverError(400, 'BAD_REQUEST');
  }

  const data = await request.formData();
  const login = data.get('login');

  if (typeof login !== 'string' || !login) {
    return serverError(400, 'BAD_REQUEST');
  }

  const user = await db.user.findUnique({ where: { login } });

  if (!user) {
    return serverError(404, 'NOT_FOUND');
  }

  await db.userToGroup.create({
    data: { groupId: id, userId: user.id },
  });

  const group = await db.group.findUniqueOrThrow({ where: { id }, select: selection });

  const groupDto: GroupWithUsers = {
    id: group.id,
    name: group.name,
    users: group.users.map(({ user }) => user),
  };

  return { group: groupDto };
};

export const actions: Actions = {
  updateGroup,
  deleteGroup,
  addUser,
};
