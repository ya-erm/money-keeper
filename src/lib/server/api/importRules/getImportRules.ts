import { db } from '$lib/server';
import { checkUserAndGroup } from '$lib/utils';

export async function getImportRules(locals: App.Locals) {
  const { groupId } = checkUserAndGroup(locals);

  const importRules = await db.importRule.findMany({
    where: { ownerId: groupId },
    include: {
      category: true,
      tags: true,
    },
  });

  return importRules;
}
