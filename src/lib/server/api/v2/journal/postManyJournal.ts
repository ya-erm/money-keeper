import { Prisma } from '@prisma/client';

import { ApiError } from '$lib/api';
import type { EncryptionVersion } from '$lib/data/interfaces';
import { db } from '$lib/server';

export type PostManyJournalRequestData = {
  items: {
    order: number;
    encryption: EncryptionVersion;
    data: string;
  }[];
};

/** Get the max journal order of the member, null if journal is empty */
export async function getJournalSyncNumber(uuid: string) {
  const aggregate = await db.journal.aggregate({
    _max: { order: true },
    where: { ownerUuid: uuid },
  });
  return aggregate._max.order;
}

function isUniqueConstraintError(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';
}

/**
 * Append items to the journal.
 * @throws {ApiError} 409 CONFLICT if any order is already used,
 *  the client must fetch updates and renumber its queue before retrying.
 */
export async function postManyJournal(data: PostManyJournalRequestData, uuid: string) {
  const items = data.items ?? [];

  if (items.length > 0) {
    const syncNumber = await getJournalSyncNumber(uuid);
    const minOrder = Math.min(...items.map((item) => item.order));
    if (syncNumber !== null && minOrder <= syncNumber) {
      throw new ApiError(
        409,
        'CONFLICT',
        `Journal order ${minOrder} is already used, current sync number is ${syncNumber}`,
      );
    }

    try {
      await db.journal.createMany({
        data: items.map((item) => ({
          ownerUuid: uuid,
          order: item.order,
          encryption: item.encryption,
          data: item.data,
        })),
      });
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw new ApiError(409, 'CONFLICT', 'Journal order is already used');
      }
      throw e;
    }
  }

  return { syncNumber: await getJournalSyncNumber(uuid) };
}

export type PostManyJournalResponseData = Awaited<ReturnType<typeof postManyJournal>>;
