import { ApiError } from '$lib/api';
import { countSnapshotEntities } from '$lib/data/snapshot';
import { db } from '$lib/server';
import { loadJournalSnapshot } from '$lib/server/api/v2/snapshot';
import { checkNumberOptionalParameter } from '$lib/utils';

export type JournalStatsResponseData = {
  /** Number of journal items */
  itemsCount: number;
  /** Max journal order, null if journal is empty */
  syncNumber: number | null;
};

/** Journal size of the member */
export async function getJournalStats(uuid: string): Promise<JournalStatsResponseData> {
  const [itemsCount, aggregate] = await Promise.all([
    db.journal.count({ where: { ownerUuid: uuid } }),
    db.journal.aggregate({ _max: { order: true }, where: { ownerUuid: uuid } }),
  ]);
  return { itemsCount, syncNumber: aggregate._max.order };
}

export type CompactJournalRequestData = {
  /**
   * Sync number known to the client. Compaction is refused if the journal has newer items,
   * so that the client always applies the latest state before compacting.
   */
  syncNumber?: number;
};

export type CompactJournalResponseData = {
  /** Number of journal items before compaction */
  before: number;
  /** Number of journal items after compaction */
  after: number;
  /** Order of the snapshot item */
  syncNumber: number | null;
  /** Number of entities in the snapshot */
  entitiesCount: number;
};

/**
 * Replace all journal items up to the current max order N with a single snapshot item at order N.
 * Orders stay monotonic, so sync numbers of devices remain valid: a device that has seen N gets nothing,
 * a device behind N gets the snapshot and everything after it.
 * @throws {ApiError} 400 JOURNAL_ENCRYPTED if the journal is encrypted (server can't build the snapshot)
 * @throws {ApiError} 409 CONFLICT if the journal has items newer than `syncNumber` or changed during compaction
 */
export async function compactJournal(
  data: CompactJournalRequestData,
  uuid: string,
): Promise<CompactJournalResponseData> {
  const expectedSyncNumber = checkNumberOptionalParameter(data.syncNumber, 'syncNumber');

  const { snapshot, syncNumber, itemsCount } = await loadJournalSnapshot(uuid, { deleted: 'referenced' });
  const entitiesCount = countSnapshotEntities(snapshot);

  if (expectedSyncNumber !== null && expectedSyncNumber !== syncNumber) {
    throw new ApiError(
      409,
      'CONFLICT',
      `Journal has newer items: sync number is ${syncNumber}, expected ${expectedSyncNumber}. Fetch updates first`,
    );
  }

  if (syncNumber === null || itemsCount <= 1) {
    return { before: itemsCount, after: itemsCount, syncNumber, entitiesCount };
  }

  await db.$transaction(async (tx) => {
    const aggregate = await tx.journal.aggregate({ _max: { order: true }, where: { ownerUuid: uuid } });
    if (aggregate._max.order !== syncNumber) {
      throw new ApiError(409, 'CONFLICT', 'Journal changed during compaction, try again');
    }
    await tx.journal.deleteMany({ where: { ownerUuid: uuid, order: { lte: syncNumber } } });
    await tx.journal.create({
      data: {
        ownerUuid: uuid,
        order: syncNumber,
        encryption: 'none',
        data: JSON.stringify({ snapshot }),
      },
    });
  });

  const after = await db.journal.count({ where: { ownerUuid: uuid } });

  return { before: itemsCount, after, syncNumber, entitiesCount };
}
