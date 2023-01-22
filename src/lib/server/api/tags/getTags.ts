import { db } from '$lib/server';
import { checkUserAndGroup } from '$lib/utils';

export async function getTags(locals: App.Locals) {
  const { groupId } = checkUserAndGroup(locals);

  const tags = await db.tag.findMany({
    where: { ownerId: groupId },
  });

  return tags;
}
