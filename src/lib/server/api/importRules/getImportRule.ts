import { checkNumberParameter } from '$lib/utils';
import { checkImportRule } from './utils';

export type GetImportRuleParams = {
  id: number;
};

export async function getImportRule(params: GetImportRuleParams, locals: App.Locals) {
  const id = checkNumberParameter(params.id, 'id');

  const rule = await checkImportRule(id, locals);

  return rule;
}
