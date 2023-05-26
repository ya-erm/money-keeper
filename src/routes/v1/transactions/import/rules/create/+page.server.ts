import { deps } from '$lib/deps';
import { db, withActionMiddleware } from '$lib/server';
import { createImportRule } from '$lib/server/api/importRules';
import { getTags } from '$lib/server/api/tags';
import {
  checkStringFormParameter,
  checkArrayOptionalFormParameter,
  checkNumberOptionalFormParameter,
} from '$lib/server/utils';
import { checkUserAndGroup, serialize } from '$lib/utils';

import type { Action, Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, depends }) => {
  const { groupId } = checkUserAndGroup(locals, { redirect: true });

  depends(deps.categories);
  const categories = await db.category.findMany({
    where: { ownerId: groupId },
  });

  depends(deps.tags);
  const tags = await getTags(locals);

  return {
    categories,
    tags,
  };
};

const create: Action = async ({ request, locals }) => {
  const data = await request.formData();

  const text = checkStringFormParameter(data, 'text');
  const categoryId = checkNumberOptionalFormParameter(data, 'categoryId');
  const tags = checkArrayOptionalFormParameter<number>(data, 'tags');

  const rule = await createImportRule(
    {
      text,
      categoryId,
      tags,
    },
    locals,
  );

  return { rule: serialize(rule) };
};

export const actions: Actions = {
  create: withActionMiddleware(create),
};
