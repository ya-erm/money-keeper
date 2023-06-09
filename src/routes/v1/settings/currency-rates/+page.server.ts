import { ApiError } from '$lib/api';
import { deps } from '$lib/deps';
import { db, withActionMiddleware } from '$lib/server';
import { checkNumberFormParameter, checkStringFormParameter } from '$lib/server/utils';
import { checkUserAndGroup } from '$lib/utils';
import type { Action, Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, depends }) => {
  const { userId, groupId } = checkUserAndGroup(locals, { redirect: true });

  depends(deps.settings);
  const settings = await db.userSettings.findUnique({ where: { userId } });

  depends(deps.currencyRates);
  const items = await db.currencyRate.findMany({ where: { ownerId: groupId } });

  return { settings, items };
};

const setCurrency: Action = async ({ request, locals }) => {
  const data = await request.formData();
  const currency = checkStringFormParameter(data, 'currency');

  const { userId } = checkUserAndGroup(locals, { redirect: true });

  const settings = await db.userSettings.findUnique({ where: { userId } });
  if (!settings) await db.userSettings.create({ data: { userId } });

  const currencyRate = await db.userSettings.update({
    where: { userId },
    data: { currency },
  });

  return { currencyRate };
};

const create: Action = async ({ request, locals }) => {
  const data = await request.formData();
  const cur1 = checkStringFormParameter(data, 'cur1');
  const cur2 = checkStringFormParameter(data, 'cur2');
  const rate = checkNumberFormParameter(data, 'rate');

  const { groupId } = checkUserAndGroup(locals, { redirect: true });

  const currencyRate = await db.currencyRate.create({
    data: {
      cur1,
      cur2,
      rate,
      owner: { connect: { id: groupId } },
    },
  });

  return { currencyRate };
};

const update: Action = async ({ request, locals }) => {
  const data = await request.formData();
  const id = checkNumberFormParameter(data, 'id');
  const cur1 = checkStringFormParameter(data, 'cur1');
  const cur2 = checkStringFormParameter(data, 'cur2');
  const rate = checkNumberFormParameter(data, 'rate');

  const { groupId } = checkUserAndGroup(locals, { redirect: true });

  const item = await db.currencyRate.findUnique({ where: { id } });

  if (!item) {
    throw new ApiError(404, 'NOT_FOUND', `Currency rate #${id} not found`);
  }
  if (item?.ownerId !== groupId) {
    throw new ApiError(403, 'FORBIDDEN', `You have no access to currency rate #${id}`);
  }

  const currencyRate = await db.currencyRate.update({
    where: { id },
    data: {
      cur1,
      cur2,
      rate,
      owner: { connect: { id: groupId } },
    },
  });

  return { currencyRate };
};

const deleteAction: Action = async ({ request, locals }) => {
  const data = await request.formData();
  const id = checkNumberFormParameter(data, 'id');

  const { groupId } = checkUserAndGroup(locals, { redirect: true });

  const item = await db.currencyRate.findUnique({ where: { id } });

  if (!item) {
    throw new ApiError(404, 'NOT_FOUND', `Currency rate #${id} not found`);
  }
  if (item?.ownerId !== groupId) {
    throw new ApiError(403, 'FORBIDDEN', `You have no access to currency rate #${id}`);
  }

  await db.currencyRate.delete({
    where: { id },
  });
};

export const actions: Actions = {
  setCurrency: withActionMiddleware(setCurrency),
  create: withActionMiddleware(create),
  update: withActionMiddleware(update),
  delete: withActionMiddleware(deleteAction),
};
