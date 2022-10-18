import { api } from '$lib/api';
import type { PageLoad } from './$types';

export const ssr = false;

export const load: PageLoad = async ({ params, fetch }) => {
  // @ts-ignore
  api.customFetch = fetch;
  const response = await api.groups.getGroup(parseInt(params.id));

  return response.data;
};
