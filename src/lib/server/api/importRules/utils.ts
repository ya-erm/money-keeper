import { ApiError } from '$lib/api';
import { db } from '$lib/server/database';
import { checkGroupId } from '$lib/utils/checkUser';

export async function checkImportRule(importRuleId: number, locals: App.Locals) {
  const groupId = checkGroupId(locals);

  const importRule = await db.importRule.findUnique({
    where: { id: importRuleId },
    include: {
      category: true,
      tags: true,
    },
  });

  if (!importRule) {
    throw new ApiError(404, 'NOT_FOUND', `ImportRule #${importRuleId} not found`);
  }

  if (importRule.ownerId !== groupId) {
    throw new ApiError(403, 'FORBIDDEN', `You have no access to ImportRule #${importRuleId}`);
  }

  return importRule;
}
