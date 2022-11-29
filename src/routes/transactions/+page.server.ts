import { getTransactions } from '$lib/server/api/transactions';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  return await getTransactions({}, locals);
};
