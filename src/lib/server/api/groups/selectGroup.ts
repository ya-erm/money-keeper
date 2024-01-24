import type { Cookies } from '@sveltejs/kit';

import { ApiError } from '$lib/api';
import { db } from '$lib/server';
import { checkNumberParameter, checkUserId } from '$lib/utils';

export type SelectGroupRequestData = {
  groupId: number;
};

export async function selectGroup(data: SelectGroupRequestData, locals: App.Locals, cookies: Cookies) {
  const groupId = checkNumberParameter(data.groupId, 'groupId');
  const userId = checkUserId(locals);

  const userInGroup = await db.userToGroup.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });

  if (!userInGroup) {
    throw new ApiError(403, 'FORBIDDEN', `User #${userId} is not in group #${groupId}`);
  }

  const session = cookies.get('session');

  if (!session) {
    throw new ApiError(400, 'BAD_REQUEST', 'Session not found');
  }

  await db.authToken.update({
    where: { value: session },
    data: { groupId },
  });

  locals.groupId = groupId;
}
