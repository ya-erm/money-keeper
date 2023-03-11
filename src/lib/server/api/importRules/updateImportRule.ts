import { db } from '$lib/server';
import {
  checkArrayOptionalParameter,
  checkNumberOptionalParameter,
  checkNumberParameter,
  checkStringParameter,
} from '$lib/utils';
import type { Category } from '@prisma/client';
import { checkCategory } from '../categories';
import type { CreateImportRuleRequestData } from './createImportRule';
import { checkImportRule } from './utils';

export type UpdateImportRuleParams = {
  id: number;
};

export type UpdateImportRuleRequestData = CreateImportRuleRequestData;

export async function updateImportRule(
  params: UpdateImportRuleParams,
  data: UpdateImportRuleRequestData,
  locals: App.Locals,
) {
  const id = checkNumberParameter(params.id, 'id');

  const text = checkStringParameter(data.text, 'text');
  const categoryId = checkNumberOptionalParameter(data.categoryId, 'categoryId');
  const tags = checkArrayOptionalParameter<number>(data.tags, 'tags', { type: 'number', required: true });

  const rule = await checkImportRule(id, locals);

  let category: Category | null = null;

  if (categoryId) {
    category = await checkCategory(categoryId, locals);
  }

  const tagsToRemove = rule.tags.filter((t) => !tags?.includes(t.id));

  const updatedRule = await db.importRule.update({
    where: { id },
    data: {
      text,
      categoryId: category?.id ?? null,
      tags: {
        connect: tags?.map((tagId) => ({ id: tagId })),
        disconnect: tagsToRemove?.map((tag) => ({ id: tag.id })),
      },
    },
    include: {
      category: true,
      tags: true,
    },
  });

  return updatedRule;
}
