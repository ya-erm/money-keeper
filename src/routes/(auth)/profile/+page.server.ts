import { db } from '$lib/server';
import { checkUserId } from '$lib/utils';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const userId = checkUserId(locals);

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  return { user };
};
