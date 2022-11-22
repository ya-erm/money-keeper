import { ApiError } from '$lib/api';
import { db } from '$lib/server/database';
import { checkNumberParameter, checkUserId } from '$lib/utils';

export type DeleteGroupRequestParams = {
  id: number;
};

export async function deleteGroup(data: DeleteGroupRequestParams, locals: App.Locals) {
  const userId = checkUserId(locals);
  const id = checkNumberParameter(data.id, 'id');

  const group = await db.group.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!group) {
    throw new ApiError(404, 'NOT_FOUND', `Group #${id} not found`);
  }

  const userInGroup = await db.userToGroup.findUnique({
    where: { userId_groupId: { userId, groupId: id } },
  });

  if (!userInGroup) {
    throw new ApiError(403, 'FORBIDDEN', `You have no access to group #${id}`);
  }

  await db.group.delete({ where: { id } });
}
