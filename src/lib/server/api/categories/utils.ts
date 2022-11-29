import { ApiError } from '$lib/api';
import { db } from '$lib/server';
import { checkGroupId } from '$lib/utils/checkUser';

export async function checkCategory(categoryId: number, locals: App.Locals) {
  const groupId = checkGroupId(locals);

  const category = await db.category.findUnique({ where: { id: categoryId } });

  if (!category) {
    throw new ApiError(404, 'NOT_FOUND', `Category #${categoryId} not found`);
  }

  if (category.ownerId !== groupId) {
    throw new ApiError(403, 'FORBIDDEN', `You have no access to category #${categoryId}`);
  }

  return category;
}
