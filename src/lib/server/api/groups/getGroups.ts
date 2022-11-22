import { db } from '$lib/server';
import { checkUserId } from '$lib/utils';

export async function getGroups(locals: App.Locals) {
  const userId = checkUserId(locals);

  const groups = await db.userToGroup.findMany({
    where: { userId },
    orderBy: { order: 'asc' },
    include: {
      group: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return {
    groups: groups.map((g) => g.group),
  };
}
