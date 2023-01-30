import { getGroups } from '$lib/server/api/groups';
import { checkUserId } from '$lib/utils';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  checkUserId(locals, { redirect: true });
  return await getGroups(locals);
};
