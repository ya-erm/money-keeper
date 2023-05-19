import { db } from '$lib/server';
import { checkNumberOptionalParameter } from '$lib/utils';
import { checkUuid } from '$lib/utils/checkUser';

export type GetJournalRequest = {
  start?: number;
};

export async function getJournal(data: GetJournalRequest, locals: App.Locals) {
  const start = checkNumberOptionalParameter(data.start, 'start');

  const ownerUuid = checkUuid(locals);
  const journal = await db.journal.findMany({
    where: { AND: { ownerUuid, order: { gt: start ?? 0 } } },
    select: { order: true, data: true, encryption: true },
  });
  return { journal };
}

export type GetJournalResponse = Awaited<ReturnType<typeof getJournal>>;
