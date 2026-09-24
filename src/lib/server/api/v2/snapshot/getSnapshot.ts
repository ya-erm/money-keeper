import { ApiError } from '$lib/api';
import type { JournalOperation } from '$lib/data/interfaces';
import { reduceJournal, type ReduceJournalOptions, type Snapshot } from '$lib/data/snapshot';
import { db } from '$lib/server';

export type GetSnapshotResponse = Snapshot & {
  /** Max journal order included in the snapshot, null if journal is empty */
  syncNumber: number | null;
};

/**
 * Load the whole journal of the member and reduce it to the current state.
 * Works only for unencrypted journals, because the server can't read encrypted data.
 * @throws {ApiError} 400 JOURNAL_ENCRYPTED if any journal item is encrypted
 */
export async function loadJournalSnapshot(uuid: string, options?: Partial<ReduceJournalOptions>) {
  const rows = await db.journal.findMany({
    where: { ownerUuid: uuid },
    select: { order: true, data: true, encryption: true },
    orderBy: { order: 'asc' },
  });

  const encrypted = rows.find((row) => row.encryption !== 'none');
  if (encrypted) {
    throw new ApiError(
      400,
      'JOURNAL_ENCRYPTED',
      `Journal item ${encrypted.order} is encrypted, snapshot can be built only on the client`,
    );
  }

  const items = rows.map((row) => ({ order: row.order, data: JSON.parse(row.data) as JournalOperation }));
  const snapshot = reduceJournal(items, options);
  const syncNumber = rows.length > 0 ? rows[rows.length - 1].order : null;

  return { snapshot, syncNumber, itemsCount: rows.length };
}

export async function getSnapshot(uuid: string): Promise<GetSnapshotResponse> {
  const { snapshot, syncNumber } = await loadJournalSnapshot(uuid);
  return { syncNumber, ...snapshot };
}
