import { ApiError } from '$lib/api';
import { db } from '$lib/server';
import { checkArrayOptionalParameter, checkNumberOptionalParameter, checkStringParameter } from '$lib/utils';
import { checkGroupId } from '$lib/utils/checkUser';
import type { Category } from '@prisma/client';
import { checkCategory } from '../categories';

export type CreateImportRuleRequestData = {
  text: string;
  tags?: number[] | null;
  categoryId?: number | null;
};

export async function createImportRule(data: CreateImportRuleRequestData, locals: App.Locals) {
  const text = checkStringParameter(data.text, 'text');
  const categoryId = checkNumberOptionalParameter(data.categoryId, 'categoryId');
  const tags = checkArrayOptionalParameter<number>(data.tags, 'tags', { type: 'number', required: true });

  if (!categoryId && !tags?.length) {
    throw new ApiError(400, 'BAD_REQUEST', 'Category or tags is required');
  }

  const groupId = checkGroupId(locals);

  let category: Category | null = null;

  if (categoryId) {
    category = await checkCategory(categoryId, locals);
  }

  const rule = await db.importRule.create({
    data: {
      ownerId: groupId,
      text,
      categoryId: category ? category.id : undefined,
      tags: { connect: tags?.map((tagId) => ({ id: tagId })) },
    },
    include: {
      category: true,
      tags: true,
    },
  });

  return rule;
}
