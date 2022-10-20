import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  const groupId = parseInt(params.id);

  if (Number.isNaN(groupId)) {
    throw error(400, { message: 'Bad request' });
  }

  return { id: groupId };
};
