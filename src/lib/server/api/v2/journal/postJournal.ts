import type { EncryptionVersion } from '$lib/data/interfaces';
import { db } from '$lib/server';

export type PostJournalRequestData = {
  order: number;
  encryption: EncryptionVersion;
  data: string;
};

export async function postJournal(data: PostJournalRequestData, uuid: string) {
  // TODO: check if order is already used (already catched by db, but returns 500)

  await db.journal.create({
    data: {
      ownerUuid: uuid,
      order: data.order,
      encryption: data.encryption,
      data: data.data,
    },
  });
}
