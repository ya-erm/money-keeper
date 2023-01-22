import { db } from '$lib/server';
import { checkNumberParameter } from '$lib/utils';
import { checkTag } from './utils';

export type DeleteTagParams = {
  id: number;
};

export async function deleteTag(params: DeleteTagParams, locals: App.Locals) {
  const tagId = checkNumberParameter(params.id, 'id');

  await checkTag(tagId, locals);

  await db.tag.delete({
    where: { id: tagId },
  });
}
