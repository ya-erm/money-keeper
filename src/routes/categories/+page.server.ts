import { db, isServerError, serverError } from '$lib/server';
import {
  checkUserAndGroup,
  getNumberParameterOrThrow,
  getStringOptionalParameterOrThrow,
  getStringParameterOrThrow,
} from '$lib/utils';

import type { Action, Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { groupId } = checkUserAndGroup(locals);

  const categories = await db.category.findMany({
    where: { ownerId: groupId },
  });

  return {
    categories,
  };
};

const create: Action = async ({ request, locals }) => {
  try {
    const data = await request.formData();
    const name = getStringParameterOrThrow(data, 'name');
    const icon = getStringOptionalParameterOrThrow(data, 'icon');

    const { groupId } = checkUserAndGroup(locals);

    const category = await db.category.create({
      data: {
        name,
        icon,
        type: 'OUT',
        owner: { connect: { id: groupId } },
      },
      select: {
        id: true,
        name: true,
        icon: true,
        order: true,
        type: true,
      },
    });

    return category;
  } catch (e) {
    if (isServerError(e)) return e;
    throw e;
  }
};

const update: Action = async ({ request, locals }) => {
  try {
    const data = await request.formData();
    const id = getNumberParameterOrThrow(data, 'id');
    const name = getStringParameterOrThrow(data, 'name');
    const icon = getStringOptionalParameterOrThrow(data, 'icon');

    const { groupId } = checkUserAndGroup(locals);

    const category = await db.category.findUnique({
      where: { id },
    });

    if (!category) {
      return serverError(404, 'NOT_FOUND');
    }

    if (category.ownerId !== groupId) {
      return serverError(403, 'FORBIDDEN');
    }

    const updatedCategory = await db.category.update({
      where: { id },
      data: {
        name,
        icon,
        owner: { connect: { id: groupId } },
      },
      select: {
        id: true,
        name: true,
        icon: true,
        order: true,
        type: true,
      },
    });

    return {
      category: updatedCategory,
    };
  } catch (e) {
    if (isServerError(e)) return e;
    throw e;
  }
};

const deleteCategory: Action = async ({ request, locals }) => {
  try {
    const data = await request.formData();
    const id = getNumberParameterOrThrow(data, 'id');

    const { groupId } = checkUserAndGroup(locals);

    const category = await db.category.findUnique({
      where: { id },
    });

    if (!category) {
      return serverError(404, 'NOT_FOUND');
    }

    if (category.ownerId !== groupId) {
      return serverError(403, 'FORBIDDEN');
    }

    await db.category.delete({
      where: { id },
    });
  } catch (e) {
    if (isServerError(e)) return e;
    throw e;
  }
};

export const actions: Actions = {
  create,
  update,
  delete: deleteCategory,
};
