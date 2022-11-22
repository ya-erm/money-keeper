import { ApiError } from '$lib/api';
import { db } from '$lib/server/database';
import { checkNumberParameter, checkStringParameter, checkUserId } from '$lib/utils';
import { groupSelection, mapGroup } from './interfaces';

export type AddUserToGroupRequestParams = {
  id: number;
};

export type AddUserToGroupRequestData = {
  login: string;
};

export async function addUserToGroup(
  params: AddUserToGroupRequestParams,
  data: AddUserToGroupRequestData,
  locals: App.Locals,
) {
  const userId = checkUserId(locals);
  const groupId = checkNumberParameter(params.id, 'id');

  const userInGroup = await db.userToGroup.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });

  if (!userInGroup) {
    throw new ApiError(404, 'NOT_FOUND', `Group #${groupId} not found`);
  }

  const login = checkStringParameter(data.login, 'login');

  const otherUser = await db.user.findUnique({ where: { login } });

  if (!otherUser) {
    throw new ApiError(404, 'NOT_FOUND', `User ${login} not found`);
  }

  const otherUserInGroup = await db.userToGroup.findUnique({
    where: { userId_groupId: { userId: otherUser.id, groupId } },
  });

  if (otherUserInGroup) {
    throw new ApiError(409, 'USER_ALREADY_EXISTS', `User ${login} already in group #${groupId}`);
  }

  await db.userToGroup.create({
    data: { groupId, userId: otherUser.id },
  });

  const group = await db.group.findUniqueOrThrow({
    where: { id: groupId },
    select: groupSelection,
  });

  return mapGroup(group);
}
