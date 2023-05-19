import type { EncryptionVersion } from '$lib/data/interfaces';
import { db } from '$lib/server';
import { checkUuid } from '$lib/utils/checkUser';

export type PostManyJournalRequestData = {
  items: {
    order: number;
    encryption: EncryptionVersion;
    data: string;
  }[];
};

export async function postManyJournal(data: PostManyJournalRequestData, locals: App.Locals) {
  const uuid = checkUuid(locals);

  // TODO: check if order is already used (already catched by db, but returns 500)

  await db.journal.createMany({
    data: data.items.map((item) => ({
      ownerUuid: uuid,
      order: item.order,
      encryption: item.encryption,
      data: item.data,
    })),
  });

  const syncNumber = await db.journal.aggregate({
    _max: { order: true },
    where: { ownerUuid: uuid },
  });

  return { syncNumber: syncNumber._max.order };
}

export type PostManyJournalResponseData = Awaited<ReturnType<typeof postManyJournal>>;
