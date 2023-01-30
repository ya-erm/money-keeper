import bcrypt from 'bcrypt';

import { ApiError } from '$lib/api';
import { db } from '$lib/server';
import { checkParameter, checkStringOptionalParameter, checkNumberOptionalParameter, checkUserId } from '$lib/utils';
import { selectGroup } from '../groups';
import type { Cookies } from '@sveltejs/kit';

export type UpdateUserParams = {
  id: number;
};

export type UpdateUserRequestData = {
  name?: string;
  login?: string;
  oldPassword?: string;
  newPassword?: string;
  groupId?: number;
};

export async function updateUser(
  params: UpdateUserParams,
  data: UpdateUserRequestData,
  locals: App.Locals,
  cookies: Cookies,
) {
  const userId = checkUserId(locals);

  if (params.id !== userId) {
    throw new ApiError(403, 'FORBIDDEN', `You have no access to update user #${params.id}`);
  }

  const name = checkStringOptionalParameter(data.name, 'name');
  const login = checkStringOptionalParameter(data.login, 'login');
  const groupId = checkNumberOptionalParameter(data.groupId, 'groupId');
  const newPassword = checkStringOptionalParameter(data.newPassword, 'newPassword');
  const oldPassword = checkParameter<string | null>(data.oldPassword, 'oldPassword', {
    type: 'string',
    required: !!newPassword,
  });

  if (!!oldPassword && !!newPassword) {
    const userPassword = await db.userPassword.findUnique({
      where: { userId },
    });
    const correctPassword = await bcrypt.compare(oldPassword, userPassword?.hash ?? '');
    if (!correctPassword) {
      throw new ApiError(403, 'INCORRECT_LOGIN_OR_PASSWORD', 'Incorrect password');
    }
    await db.userPassword.update({
      where: { userId },
      data: {
        hash: await bcrypt.hash(newPassword, 10),
      },
    });
  }

  if (groupId) {
    await selectGroup({ groupId }, locals, cookies);
  }

  const user = await db.user.update({
    where: { id: userId },
    data: {
      name: name ?? undefined,
      login: login ?? undefined,
    },
  });
  return user;
}
