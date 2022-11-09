import { error, redirect } from '@sveltejs/kit';

import { routes } from '$lib/routes';
import { db, isServerError, serverError } from '$lib/server';
import { checkUserAndGroup, getStringOptionalFormParameter, getStringFormParameter } from '$lib/utils';

import type { Action, Actions, PageServerLoad, RouteParams } from './$types';

const selection = {
  id: true,
  name: true,
  icon: true,
  order: true,
  type: true,
};

const validate = async ({ params, locals }: { params: RouteParams; locals: App.Locals }) => {
  const { user, groupId } = checkUserAndGroup(locals);

  const categoryId = parseInt(params.id);

  if (Number.isNaN(categoryId)) {
    throw serverError(400, 'BAD_REQUEST');
  }

  const category = await db.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw serverError(404, 'NOT_FOUND');
  }

  if (category.ownerId !== groupId) {
    throw serverError(403, 'FORBIDDEN');
  }

  return {
    user,
    groupId,
    categoryId,
    category,
  };
};

export const load: PageServerLoad = async ({ params, locals }) => {
  try {
    const { category } = await validate({ params, locals });

    return { category };
  } catch (e) {
    if (isServerError(e)) throw error(e.status, e.data.error.code);
    throw e;
  }
};

const updateCategory: Action = async ({ params, request, locals }) => {
  try {
    const { categoryId } = await validate({ params, locals });

    const data = await request.formData();
    const name = getStringFormParameter(data, 'name');
    const icon = getStringOptionalFormParameter(data, 'icon');

    await db.category.update({
      where: { id: categoryId },
      data: {
        name,
        icon,
      },
      select: selection,
    });

    throw redirect(302, routes.categories.path);
  } catch (e) {
    if (isServerError(e)) return e;
    throw e;
  }
};

const deleteCategory: Action = async ({ params, locals }) => {
  try {
    const { categoryId } = await validate({ params, locals });

    await db.category.delete({
      where: { id: categoryId },
    });

    throw redirect(302, routes.categories.path);
  } catch (e) {
    if (isServerError(e)) return e;
    throw e;
  }
};

export const actions: Actions = {
  update: updateCategory,
  delete: deleteCategory,
};
