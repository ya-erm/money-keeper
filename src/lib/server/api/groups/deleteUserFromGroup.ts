import { ApiError } from '$lib/api';
import { db } from '$lib/server/database';
import { checkNumberParameter, checkUserId } from '$lib/utils';
import { groupSelection, mapGroup } from './interfaces';

export type DeleteUserFromGroupRequestParams = {
  id: number;
};

export type DeleteUserFromGroupRequestData = {
  userId: number;
};

export async function deleteUserFromGroup(
  params: DeleteUserFromGroupRequestParams,
  data: DeleteUserFromGroupRequestData,
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

  const otherUserId = checkNumberParameter(data.userId, 'userId');

  const otherUserInGroup = await db.userToGroup.findUnique({
    where: { userId_groupId: { groupId, userId: otherUserId } },
  });

  if (!otherUserInGroup) {
    throw new ApiError(404, 'NOT_FOUND', `User #${otherUserId} not in group #${groupId}`);
  }

  await db.userToGroup.delete({
    where: { userId_groupId: { groupId, userId: otherUserId } },
  });

  const group = await db.group.findUniqueOrThrow({
    where: { id: groupId },
    select: groupSelection,
  });

  return mapGroup(group);
}
