import { db } from '$lib/server';
import { checkNumberParameter, checkStringParameter } from '$lib/utils';
import { checkTag } from './utils';

export type UpdateTagParams = {
  id: number;
};

export type UpdateTagRequestData = {
  name: string;
};

export async function updateTag(params: UpdateTagParams, data: UpdateTagRequestData, locals: App.Locals) {
  const tagId = checkNumberParameter(params.id, 'id');
  const name = checkStringParameter(data.name, 'name');

  await checkTag(tagId, locals);

  const updatedTag = await db.tag.update({
    where: { id: tagId },
    data: { name },
  });

  return updatedTag;
}
