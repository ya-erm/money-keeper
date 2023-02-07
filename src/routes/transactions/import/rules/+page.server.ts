import { error } from '@sveltejs/kit';

import { deps } from '$lib/deps';
import { getImportRules } from '$lib/server/api/importRules';

import { isApiError } from '$lib/api/ApiError';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, depends }) => {
  try {
    depends(deps.importRules);
    const rules = await getImportRules(locals);
    return { rules };
  } catch (e) {
    if (isApiError(e)) throw error(e.status, e.code);
    throw e;
  }
};
