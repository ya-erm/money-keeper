import { db } from '$lib/server';
import { checkUuid } from '$lib/utils/checkUser';

export type PostJournalRequestData = {
  order: number;
  data: string;
};

export async function postJournal(data: PostJournalRequestData, locals: App.Locals) {
  const uuid = checkUuid(locals);

  // TODO: check if order is already used (already catched by db, but returns 500)

  await db.journal.create({
    data: {
      ownerUuid: uuid,
      order: data.order,
      data: data.data,
    },
  });
}
