import { db } from '$lib/server';
import { checkNumberOptionalParameter } from '$lib/utils';

export type GetJournalRequest = {
  start?: number;
};

export async function getJournal(data: GetJournalRequest, uuid: string) {
  const start = checkNumberOptionalParameter(data.start, 'start');

  const journal = await db.journal.findMany({
    where: { AND: { ownerUuid: uuid, order: { gt: start ?? 0 } } },
    select: { order: true, data: true, encryption: true },
  });
  return { journal };
}

export type GetJournalResponse = Awaited<ReturnType<typeof getJournal>>;
