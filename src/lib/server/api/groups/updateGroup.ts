import { ApiError } from '$lib/api';
import { db } from '$lib/server/database';
import { checkNumberParameter, checkStringParameter, checkUserId } from '$lib/utils';
import { groupSelection, mapGroup } from './interfaces';

export type UpdateGroupRequestParams = {
  id: number;
};

export type UpdateGroupRequestData = {
  name: string;
};

export async function updateGroup(params: UpdateGroupRequestParams, data: UpdateGroupRequestData, locals: App.Locals) {
  const userId = checkUserId(locals);
  const id = checkNumberParameter(params.id, 'id');
  const name = checkStringParameter(data.name, 'name');

  const userInGroup = await db.userToGroup.findUnique({
    where: { userId_groupId: { userId, groupId: id } },
  });

  if (!userInGroup) {
    throw new ApiError(404, 'NOT_FOUND', `Group #${id} not found`);
  }

  const group = await db.group.update({
    where: { id },
    data: {
      name,
    },
    select: groupSelection,
  });

  return mapGroup(group);
}
