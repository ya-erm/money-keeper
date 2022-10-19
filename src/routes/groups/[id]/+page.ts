import { api } from '$lib/api';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
  const groupId = parseInt(params.id);

  if (Number.isNaN(groupId)) {
    throw error(400, { message: 'Bad request' });
  }

  // @ts-ignore
  api.customFetch = fetch;
  try {
    const response = await api.groups.getGroup(groupId);
    return { id: groupId, group: response.data };
  } catch {
    return { id: groupId };
  }
};
