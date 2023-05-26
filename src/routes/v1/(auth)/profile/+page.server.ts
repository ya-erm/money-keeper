import { deps } from '$lib/deps';
import { db } from '$lib/server';
import { checkUserId } from '$lib/utils';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, depends }) => {
  const userId = checkUserId(locals, { redirect: true });

  depends(deps.user);
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  return { user };
};
