import { db } from '$lib/server';
import { checkStringParameter } from '$lib/utils';
import { checkGroupId } from '$lib/utils/checkUser';

export type CreateTagRequestData = {
  name: string;
};

export async function createTag(data: CreateTagRequestData, locals: App.Locals) {
  const name = checkStringParameter(data.name, 'name');

  const groupId = checkGroupId(locals);

  const tag = await db.tag.create({
    data: {
      name,
      ownerId: groupId,
    },
  });

  return tag;
}
