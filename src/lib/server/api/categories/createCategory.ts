import { db } from '$lib/server';
import { checkStringParameter, checkStringOptionalParameter } from '$lib/utils';
import { checkGroupId } from '$lib/utils/checkUser';

export type CreateCategoryRequestData = {
  name: string;
  type: string;
  icon: string;
};

export async function createCategory(data: CreateCategoryRequestData, locals: App.Locals) {
  const name = checkStringParameter(data.name, 'name');
  const type = checkStringParameter(data.type, 'type');
  const icon = checkStringOptionalParameter(data.icon, 'icon');

  const groupId = checkGroupId(locals);

  const category = await db.category.create({
    data: {
      name,
      type,
      icon,
      ownerId: groupId,
    },
  });

  return category;
}
