import { ApiError } from '$lib/api';
import { db } from '$lib/server';
import { checkGroupId } from '$lib/utils/checkUser';

export async function checkAccount(accountId: number, locals: App.Locals) {
  const groupId = checkGroupId(locals);

  const account = await db.account.findUnique({ where: { id: accountId } });

  if (!account) {
    throw new ApiError(404, 'NOT_FOUND', `Account #${accountId} not found`);
  }

  if (account.ownerId !== groupId) {
    throw new ApiError(403, 'FORBIDDEN', `You have no access to account #${accountId}`);
  }

  return account;
}
