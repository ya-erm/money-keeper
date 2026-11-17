import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/ApiError';
import type { JournalItem, JournalOperation } from './interfaces';
import { JournalService } from './journal';

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  updateSyncNumber: vi.fn(),
  rows: new Map<string, JournalItem & { owner: string }>(),
}));
vi.mock('#lib/utils/useFetch.js', () => ({
  useFetch: (_method: string, url: string) => ({ fetch: (body: unknown) => mocks.fetch(url, body) }),
}));
vi.mock('@ya-erm/svelte-ui/toasts', () => ({ showErrorToast: vi.fn() }));
vi.mock('#lib/utils/logger.js', () => ({
  Logger: class {
    debug() {}
    log() {}
    error() {}
  },
}));
vi.mock('./members', () => ({
  membersService: {
    isGuest: false,
    getSelectedMember: () => ({ uuid: 'device-owner' }),
    selectedMemberSettings: { syncNumber: 0, encryption: 'none' },
    updateSyncNumber: mocks.updateSyncNumber,
  },
}));
vi.mock('./useDB', () => {
  const key = (owner: string, order: number) => JSON.stringify([owner, order]);
  const put = async (row: JournalItem & { owner: string }) => {
    mocks.rows.set(key(row.owner, row.order), row);
  };
  return {
    useDB: async () => ({
      getAllFromIndex: async (_store: string, _index: string, owner: string) =>
        [...mocks.rows.values()].filter((row) => row.owner === owner),
      put: (_store: string, row: JournalItem & { owner: string }) => put(row),
      clear: async () => {
        mocks.rows.clear();
      },
      transaction: () => ({
        store: {
          put,
          delete: async ([owner, order]: [string, number]) => {
            mocks.rows.delete(key(owner, order));
          },
        },
        done: Promise.resolve(),
      }),
    }),
  };
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
const contact = (id: string): JournalOperation => ({ debtContact: { id, name: id } });
const debt: JournalOperation = {
  debtRecord: { id: 'debt', contactId: 'anna', amount: 20, currency: 'EUR', date: '2026-11-17' },
};
const remote = (order: number, data: JournalOperation) => ({ order, data: JSON.stringify(data), encryption: 'none' });

describe('journal synchronization', () => {
  let service: JournalService;
  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.rows.clear();
    mocks.updateSyncNumber.mockResolvedValue(undefined);
    mocks.fetch.mockImplementation(async (url, body) =>
      url.endsWith('get-updates') ? { journal: [] } : { syncNumber: body.items.at(-1).order },
    );
    service = new JournalService();
    await service.init();
  });

  it('keeps contacts and debts added while an earlier upload is in flight, including after reload', async () => {
    const response = deferred<{ syncNumber: number }>();
    mocks.fetch.mockReturnValueOnce(response.promise);
    await service.addOperationToQueue(contact('anna'), { upload: false });
    const upload = service.uploadQueue();
    await vi.waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(1));
    await service.addOperationToQueue(contact('max'), { upload: false });
    await service.addOperationToQueue(debt, { upload: false });
    response.resolve({ syncNumber: 1 });
    await upload;
    expect(service.queue.map((item) => item.data)).toEqual([contact('max'), debt]);
    const reloaded = new JournalService();
    await reloaded.init();
    expect(reloaded.queue.map((item) => item.data)).toEqual([contact('max'), debt]);
  });

  it('serializes overlapping upload requests without resending or dropping contacts', async () => {
    const first = deferred<{ syncNumber: number }>();
    mocks.fetch.mockReturnValueOnce(first.promise);
    await service.addOperationToQueue(contact('anna'), { upload: false });
    const a = service.uploadQueue();
    await vi.waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(1));
    await service.addOperationToQueue(contact('max'), { upload: false });
    const b = service.uploadQueue();
    await Promise.resolve();
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    first.resolve({ syncNumber: 1 });
    await Promise.all([a, b]);
    expect(
      mocks.fetch.mock.calls.map(([, body]) => body.items.map((item: { data: string }) => JSON.parse(item.data))),
    ).toEqual([[contact('anna')], [contact('max')]]);
    expect(service.queue).toEqual([]);
  });

  it('does not advance the download cursor before all subscribers have saved their changes', async () => {
    const saved = deferred<void>();
    const applyChanges = vi.fn(() => saved.promise);
    service.addSubscriber({ name: 'debt-contacts', applyChanges });
    mocks.fetch.mockResolvedValueOnce({ journal: [remote(2, contact('max'))] });
    const sync = service.syncWithServer();
    await vi.waitFor(() => expect(applyChanges).toHaveBeenCalled());
    expect(service.syncNumber).toBe(0);
    expect(mocks.updateSyncNumber).not.toHaveBeenCalled();
    saved.resolve();
    await sync;
    expect(service.syncNumber).toBe(2);
    expect(mocks.updateSyncNumber).toHaveBeenLastCalledWith(2);
  });

  it('fetches the same updates again after a subscriber fails instead of permanently skipping them', async () => {
    const applyChanges = vi.fn().mockRejectedValueOnce(new Error('Storage unavailable')).mockResolvedValue(undefined);
    service.addSubscriber({ name: 'debt-contacts', applyChanges });
    mocks.fetch.mockResolvedValue({ journal: [remote(2, contact('max'))] });
    await expect(service.syncWithServer()).rejects.toThrow('Storage unavailable');
    expect(service.syncNumber).toBe(0);
    await service.syncWithServer();
    expect(mocks.fetch.mock.calls.map(([, body]) => body.start)).toEqual([0, 0]);
    expect(service.syncNumber).toBe(2);
  });

  it('acknowledges only its own batch even if another device has already advanced the server head', async () => {
    await service.addOperationToQueue(contact('anna'), { upload: false });
    mocks.fetch.mockResolvedValueOnce({ syncNumber: 3 });
    await service.uploadQueue();
    expect(service.syncNumber).toBe(1);
    mocks.fetch.mockResolvedValueOnce({ journal: [remote(2, contact('max')), remote(3, debt)] });
    const applyChanges = vi.fn();
    service.addSubscriber({ name: 'debts', applyChanges });
    await service.syncWithServer();
    expect(mocks.fetch).toHaveBeenLastCalledWith('/api/v2/journal/get-updates', { start: 1 });
    expect(applyChanges).toHaveBeenCalledWith(
      [
        { order: 2, data: contact('max') },
        { order: 3, data: debt },
      ],
      true,
    );
  });

  it('keeps another workspace outgoing journal when acknowledging this workspace batch', async () => {
    const other = { owner: 'other-owner', order: 1, data: contact('private') };
    mocks.rows.set(JSON.stringify(['other-owner', 1]), other);
    await service.addOperationToQueue(contact('anna'), { upload: false });
    await service.uploadQueue();
    expect([...mocks.rows.values()]).toEqual([other]);
  });

  it('persists rebased orders on conflict and retains the queue if the retry fails', async () => {
    await service.addOperationToQueue(contact('anna'), { upload: false });
    mocks.fetch
      .mockRejectedValueOnce(new ApiError(409, 'CONFLICT', 'Concurrent update'))
      .mockResolvedValueOnce({ journal: [remote(4, contact('max'))] })
      .mockRejectedValueOnce(new Error('Offline'));
    await service.tryUploadQueue();
    expect(service.syncNumber).toBe(4);
    expect(service.queue).toEqual([{ order: 5, data: contact('anna') }]);
    expect([...mocks.rows.values()]).toEqual([{ owner: 'device-owner', order: 5, data: contact('anna') }]);
  });

  it('does not upload against an unconfirmed server state after a failed download', async () => {
    await service.addOperationToQueue(contact('anna'), { upload: false });
    mocks.fetch.mockRejectedValueOnce(new Error('Offline'));
    await service.syncWithServer();
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(service.queue.map((item) => item.data)).toEqual([contact('anna')]);
  });

  it('waits for all subscribers to settle when one fails, keeping the old cursor', async () => {
    const saved = deferred<void>();
    const other = vi.fn(() => saved.promise);
    service.addSubscriber({
      name: 'contacts',
      applyChanges: () => {
        throw new Error('Storage unavailable');
      },
    });
    service.addSubscriber({ name: 'operations', applyChanges: other });
    mocks.fetch.mockResolvedValueOnce({ journal: [remote(2, contact('max'))] });
    let finished = false;
    const result = service.syncWithServer().catch((error) => {
      finished = true;
      return error as Error;
    });
    await vi.waitFor(() => expect(other).toHaveBeenCalled());
    expect(finished).toBe(false);
    saved.resolve();
    expect((await result)?.message).toBe('Storage unavailable');
    expect(service.syncNumber).toBe(0);
  });

  it('serializes downloads and uploads so remote contacts are applied before rebasing local changes', async () => {
    const downloaded = deferred<{ journal: ReturnType<typeof remote>[] }>();
    mocks.fetch.mockReturnValueOnce(downloaded.promise);
    const applyChanges = vi.fn();
    service.addSubscriber({ name: 'contacts', applyChanges });
    const sync = service.syncWithServer();
    await vi.waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(1));
    await service.addOperationToQueue(contact('anna'), { upload: false });
    const upload = service.uploadQueue();
    await Promise.resolve();
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    downloaded.resolve({ journal: [remote(1, contact('max'))] });
    await Promise.all([sync, upload]);
    expect(applyChanges.mock.calls[0][0]).toEqual([{ order: 1, data: contact('max') }]);
    expect(mocks.fetch.mock.calls[1][1].items).toEqual([
      { order: 2, encryption: 'none', data: JSON.stringify(contact('anna')) },
    ]);
    expect(service.syncNumber).toBe(2);
  });
});
