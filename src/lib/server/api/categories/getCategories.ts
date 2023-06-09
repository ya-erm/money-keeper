import { db } from '$lib/server';
import { checkUserAndGroup } from '$lib/utils';

export async function getCategories(locals: App.Locals) {
  const { groupId } = checkUserAndGroup(locals);

  const categories = await db.category.findMany({
    where: { ownerId: groupId },
  });

  return categories;
}
