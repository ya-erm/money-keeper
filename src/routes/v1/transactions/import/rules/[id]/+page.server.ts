import { deps } from '$lib/deps';
import { db, withActionMiddleware } from '$lib/server';
import { deleteImportRule, getImportRule, updateImportRule } from '$lib/server/api/importRules';
import { getTags } from '$lib/server/api/tags';
import {
  checkArrayOptionalFormParameter,
  checkNumberOptionalFormParameter,
  checkStringFormParameter,
} from '$lib/server/utils';
import { checkNumberParameter, checkUserAndGroup, serialize } from '$lib/utils';

import type { Action, Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, depends }) => {
  const { groupId } = checkUserAndGroup(locals, { redirect: true });

  const ruleId = checkNumberParameter(params.id, 'id');

  depends(deps.categories);
  const categories = await db.category.findMany({
    where: { ownerId: groupId },
  });

  depends(deps.tags);
  const tags = await getTags(locals);

  depends(deps.importRules);
  const rule = await getImportRule({ id: ruleId }, locals);

  return {
    categories,
    tags,
    rule,
  };
};

const update: Action = async ({ params, request, locals }) => {
  const data = await request.formData();

  const ruleId = checkNumberParameter(params.id, 'id');

  const text = checkStringFormParameter(data, 'text');
  const categoryId = checkNumberOptionalFormParameter(data, 'categoryId');
  const tags = checkArrayOptionalFormParameter<number>(data, 'tags');

  const rule = await updateImportRule(
    { id: ruleId },
    {
      text,
      categoryId,
      tags,
    },
    locals,
  );

  return { rule: serialize(rule) };
};

const deleteRule: Action = async ({ params, locals }) => {
  const ruleId = checkNumberParameter(params.id, 'id');

  await deleteImportRule({ id: ruleId }, locals);
};

export const actions: Actions = {
  update: withActionMiddleware(update),
  delete: withActionMiddleware(deleteRule),
};
