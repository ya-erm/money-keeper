import { deps } from '$lib/deps';
import { db } from '$lib/server';
import { getGroups } from '$lib/server/api/groups';
import { checkUserAndGroup } from '$lib/utils';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, depends }) => {
  const { userId, groupId } = checkUserAndGroup(locals, { redirect: true });

  depends(deps.user);
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  depends(deps.groups);
  const { groups } = await getGroups(locals);

  depends(deps.group);
  const group =
    groups.find(({ id }) => id === groupId) ??
    (await db.group.findUnique({
      where: { id: groupId },
    }));

  return { user, groups, group };
};
