import { redirect } from '@sveltejs/kit';

import { routes } from '$lib/routes';
import { db } from '$lib/server';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, routes.login.path);
  }

  const groups = await db.userToGroup.findMany({
    where: { userId: locals.user.id },
    orderBy: { order: 'asc' },
    include: { group: true },
  });

  return {
    groups: groups.map((g) => g.group),
  };
};
