import { db } from '$lib/server';
import { checkNumberParameter } from '$lib/utils';
import { checkImportRule } from './utils';

export type DeleteImportRuleParams = {
  id: number;
};

export async function deleteImportRule(params: DeleteImportRuleParams, locals: App.Locals) {
  const id = checkNumberParameter(params.id, 'id');

  await checkImportRule(id, locals);

  await db.importRule.delete({
    where: { id },
  });
}
