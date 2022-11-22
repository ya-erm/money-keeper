import { ApiError } from '$lib/api';
import { db } from '$lib/server';
import { checkNumberParameter, checkUserId } from '$lib/utils';
import { groupSelection, mapGroup } from './interfaces';

export type GetGroupRequestParams = {
  id: number;
};

export async function getGroupById(params: GetGroupRequestParams, locals: App.Locals) {
  const id = checkNumberParameter(params.id, 'id');
  const userId = checkUserId(locals);

  const userInGroup = await db.userToGroup.findUnique({
    where: { userId_groupId: { groupId: id, userId } },
  });

  if (userInGroup === null) {
    throw new ApiError(404, 'NOT_FOUND', `Group #${id} not found`);
  }

  const group = await db.group.findUnique({
    where: { id },
    select: groupSelection,
  });

  if (group === null) {
    throw new ApiError(404, 'NOT_FOUND', `Group #${id} not found`);
  }

  return mapGroup(group);
}
