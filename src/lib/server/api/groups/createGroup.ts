import { db } from '$lib/server/database';
import { checkStringParameter, checkUserId } from '$lib/utils';
import { groupSelection, mapGroup } from './interfaces';

export type CreateGroupRequestData = {
  name: string;
};

export async function createGroup(data: CreateGroupRequestData, locals: App.Locals) {
  const userId = checkUserId(locals);
  const name = checkStringParameter(data.name, 'name');

  const userInGroup = await db.userToGroup.create({
    data: {
      user: {
        connect: { id: userId },
      },
      group: {
        create: {
          name,
        },
      },
    },
    include: {
      group: {
        select: groupSelection,
      },
    },
  });

  return mapGroup(userInGroup.group);
}
