import { ApiError } from '$lib/api';
import { db } from '$lib/server/database';
import { checkGroupId } from '$lib/utils/checkUser';

export async function checkTag(tagId: number, locals: App.Locals) {
  const groupId = checkGroupId(locals);

  const tag = await db.tag.findUnique({ where: { id: tagId } });

  if (!tag) {
    throw new ApiError(404, 'NOT_FOUND', `Tag #${tagId} not found`);
  }

  if (tag.ownerId !== groupId) {
    throw new ApiError(403, 'FORBIDDEN', `You have no access to tag #${tagId}`);
  }

  return tag;
}
