import { checkNumberParameter } from '$lib/utils';
import { checkTag } from './utils';

export type GetTagParams = {
  id: number;
};

export async function getTag(params: GetTagParams, locals: App.Locals) {
  const tagId = checkNumberParameter(params.id, 'id');

  const tag = await checkTag(tagId, locals);

  return tag;
}
