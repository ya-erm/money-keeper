import type {
  GetJournalResponse,
  PostManyJournalRequestData,
  PostManyJournalResponseData,
} from '#lib/server/api/v2/journal/index.js';
import type { GetJournalRequest } from '#lib/server/api/v2/journal/getJournal.js';
import { isApiError } from '#lib/api/ApiError.js';
import { store } from '#lib/store.js';
import { showErrorToast } from '@ya-erm/svelte-ui/toasts';
import { unexpectedCase } from '#lib/utils/unexpectedCase.js';
import { Logger } from '#lib/utils/logger.js';
import { useFetch } from '#lib/utils/useFetch.js';

import { decryptAsync, encryptAsync } from './crypto';
import type { EncryptionVersion, Initialisable, JournalItem, JournalOperation, JournalSubscriber } from './interfaces';
import { membersService } from './members';
import { useDB } from './useDB';

const logger = new Logger('JournalService', { disabled: false });

type JournalState = 'downloading' | 'uploading' | 'idle';

export class JournalService implements Initialisable {
  private _updates = store<JournalItem[]>([]);
  private _queue = store<JournalItem[]>([]);
  private _syncNumber = store<number>(-1);
  private _state = store<JournalState>('idle');

  private _subscribers = new Map<string, JournalSubscriber>();
  private _syncWork: Promise<void> = Promise.resolve();
  private _queueWork: Promise<void> = Promise.resolve();

  private runSync<T>(work: () => Promise<T>): Promise<T> {
    const result = this._syncWork.then(work);
    this._syncWork = result.then(
      () => {},
      () => {},
    );
    return result;
  }

  private writeQueue<T>(work: () => Promise<T>): Promise<T> {
    const result = this._queueWork.then(work);
    this._queueWork = result.then(
      () => {},
      () => {},
    );
    return result;
  }

  private async advanceSyncNumber(value: number) {
    if (value <= this.syncNumber) return;
    await membersService.updateSyncNumber(value);
    this._syncNumber.set(value);
  }

  /** Incoming queue of updates */
  get updates() {
    return this._updates.value;
  }

  /** Outgoing queue to sync */
  get queue() {
    return this._queue.value;
  }

  /** Journal sync number */
  get syncNumber() {
    return this._syncNumber.value;
  }

  /** Synchronization state */
  get $state() {
    return this._state.readable;
  }

  addSubscriber(subscriber: JournalSubscriber) {
    if (this._subscribers.has(subscriber.name)) {
      console.warn(`Subscriber with name ${subscriber.name} already exists. It will be replaced with a new one`);
    }
    this._subscribers.set(subscriber.name, subscriber);
  }

  removeSubscriber(id: string) {
    if (!this._subscribers.has(id)) {
      console.warn(`Subscriber with id ${id} does not exist`);
    }
    this._subscribers.delete(id);
  }

  /** Initialisation */
  init() {
    return this.runSync(async () => {
      logger.log('Load outgoing queue from local DB');
      await this.loadQueueFromDB();

      if (this.queue.length > 0) {
        logger.log('Apply queue to subscribers');
        await this.applyChangesToSubscribers(this.queue, false);
      }
    });
  }

  reset() {
    logger.debug('Reset journal service');
    this._updates.reset();
    this._queue.reset();
    this._syncNumber.reset();
    this._state.reset();
  }

  /** Synchronize updates with server */
  syncWithServer() {
    return this.runSync(async () => {
      logger.log('Fetch updates from server, sync number:', this.syncNumber);
      if (!(await this.tryFetchUpdates())) return;

      if (this.queue.length > 0 && this.updates.length > 0) {
        logger.log(
          `Warning. Incoming: ${this.updates.length}, outgoing: ${this.queue.length}. Conflicts may be ocurred`,
        );
      }

      await this.applyFetchedUpdates();

      if (this.queue.length > 0) {
        logger.log('Upload queue to server');
        await this.tryUploadQueueInternal(true);
      }
    });
  }

  private async applyFetchedUpdates() {
    const updates = this.updates;
    if (!updates.length) return;
    try {
      await this.applyChangesToSubscribers(updates, true);
    } finally {
      // Preserve local changes even if one subscriber could not save the download.
      if (this.queue.length) await this.applyChangesToSubscribers(this.queue, true);
    }
    // Persist the cursor only after every subscriber has durably saved the batch.
    await this.advanceSyncNumber(updates[updates.length - 1].order);
    this._updates.set([]);
  }

  /** Apply changes to subscribers */
  async applyChangesToSubscribers(changes: JournalItem[], saveToDB: boolean) {
    if (changes.length === 0) return;
    const subscribers = Array.from(this._subscribers.values());
    logger.debug('Apply changes to subscribers', { changes, subscribers });
    const results = await Promise.allSettled(
      subscribers.map((subscriber) => Promise.resolve().then(() => subscriber.applyChanges(changes, saveToDB))),
    );
    const failed = results.find((result) => result.status === 'rejected');
    if (failed?.status === 'rejected') throw failed.reason;
  }

  /** Fetch updates updates from server */
  private async fetchUpdates() {
    this._updates.set([]);
    // await new Promise<void>((resolve) => setTimeout(() => resolve(), 5000));
    const fetcher = useFetch<GetJournalRequest, GetJournalResponse>('POST', '/api/v2/journal/get-updates');
    const { journal } = await fetcher.fetch({ start: this.syncNumber });
    const items = await Promise.all(
      journal.map(async (item: { order: number; data: string; encryption: string }) => {
        const encryption = item.encryption as EncryptionVersion;
        switch (encryption) {
          case 'none': {
            const result: JournalItem = {
              order: item.order,
              data: JSON.parse(item.data) as JournalOperation,
            };
            return result;
          }
          case 'aes+rsa-v1': {
            const member = membersService.getSelectedMember();
            const privateKey = JSON.parse(member.privateKey) as JsonWebKey;
            const { encryptedMessage, encryptedAesKey } = JSON.parse(item.data);
            const json = await decryptAsync(privateKey, encryptedMessage, encryptedAesKey);
            const result: JournalItem = {
              order: item.order,
              data: JSON.parse(json) as JournalOperation,
            };
            return result;
          }
          default:
            throw unexpectedCase(encryption);
        }
      }),
    );
    items.sort((a: JournalItem, b: JournalItem) => a.order - b.order);
    logger.debug('Updates:', items);
    this._updates.set(items);
  }

  /** Try fetch updates from server, don't throw error */
  private async tryFetchUpdates() {
    try {
      this._state.set('downloading');
      await this.fetchUpdates();
      return true;
    } catch (e) {
      logger.error('Failed to fetch updates', e);
      if (e instanceof Error) {
        showErrorToast(`Failed to fetch updates: ${e.message}`);
      } else {
        showErrorToast('Failed to fetch updates');
      }
      return false;
    } finally {
      this._state.set('idle');
    }
  }

  /** Load queue from local database */
  private async loadQueueFromDB() {
    const db = await useDB();
    const member = membersService.getSelectedMember();
    const settings = membersService.selectedMemberSettings;
    this._syncNumber.set(settings?.syncNumber ?? -1);
    const items = await db.getAllFromIndex('journal', 'by-owner', member.uuid);
    this._queue.set(items);
  }

  /** Add operation to queue (in memory) and try to upload it */
  async addOperationToQueue(operation: JournalOperation, options?: { upload: boolean }) {
    const item = await this.writeQueue(async () => {
      const item: JournalItem = {
        order: Math.max(this.syncNumber, this.queue.at(-1)?.order ?? -1) + 1,
        data: operation,
      };
      logger.debug('Add operation to queue', { item, options });

      // Save to DB
      const db = await useDB();
      const member = membersService.getSelectedMember();
      await db.put('journal', { ...item, owner: member.uuid });
      this._queue.update((prev) => prev.concat(item));
      return item;
    });

    if (options?.upload ?? true) {
      // Try run upload asynchronously
      void this.tryUploadQueue();
    }

    return item;
  }

  /** Upload queue to the server */
  private async _uploadQueue() {
    if (membersService.isGuest) {
      logger.debug('Uploading queue: skipped (guest mode)');
      return;
    }

    // TODO: optimize queue before upload

    logger.log('Uploading queue: ', this.queue.length, 'items');
    logger.debug('Queue: ', this.queue);

    // TODO: pull and merge conflicts firstly

    const owner = membersService.getSelectedMember().uuid;
    const batch = await this.writeQueue(async () => {
      if (this.queue.some((item, index) => item.order !== this.syncNumber + index + 1)) {
        const previous = this.queue;
        const reorderedItems = previous.map((item, i) => ({ ...item, order: this.syncNumber + i + 1 }));
        const db = await useDB();
        const tx = db.transaction('journal', 'readwrite');
        await Promise.all([
          ...previous.map((item) => tx.store.delete([owner, item.order])),
          ...reorderedItems.map((item) => tx.store.put({ ...item, owner })),
          tx.done,
        ]);
        this._queue.set(reorderedItems);
      }
      return [...this.queue];
    });
    if (!batch.length) return;

    const encryption = membersService.selectedMemberSettings?.encryption ?? 'none';

    const items = await Promise.all(
      batch.map(async (item) => {
        const json = JSON.stringify(item.data);
        switch (encryption) {
          case 'none':
            return {
              order: item.order,
              encryption,
              data: json,
            };
          case 'aes+rsa-v1': {
            const member = membersService.getSelectedMember();
            const publicKey = JSON.parse(member.publicKey) as JsonWebKey;
            const { encryptedMessage, encryptedAesKey } = await encryptAsync(publicKey, json);
            return {
              order: item.order,
              encryption,
              data: JSON.stringify({ encryptedMessage, encryptedAesKey }),
            };
          }
          default:
            throw unexpectedCase(encryption);
        }
      }),
    );

    await useFetch<PostManyJournalRequestData, PostManyJournalResponseData>('POST', '/api/v2/journal').fetch({ items });

    if (membersService.getSelectedMember().uuid !== owner) throw new Error('Workspace changed during upload');
    await this.writeQueue(async () => {
      const db = await useDB();
      const tx = db.transaction('journal', 'readwrite');
      await Promise.all([...batch.map((item) => tx.store.delete([owner, item.order])), tx.done]);
      const acknowledged = new Set(batch);
      this._queue.update((queue) => queue.filter((item) => !acknowledged.has(item)));
      // The response may include newer writes from another device that we have not downloaded.
      await this.advanceSyncNumber(batch[batch.length - 1].order);
    });
    logger.log('Queue batch uploaded successfully.', 'New sync number:', this.syncNumber);
  }

  /** Upload queue to the server, @throw if error */
  uploadQueue() {
    return this.runSync(() => this.performUpload());
  }

  private async performUpload() {
    try {
      if (this.queue.length > 0) {
        this._state.set('uploading');
        await this._uploadQueue();
      }
    } catch (e) {
      logger.error('Failed to upload queue', e);
      throw new Error('Failed to upload queue', { cause: e });
    } finally {
      this._state.set('idle');
    }
  }

  /**
   * Try to upload queue to the server, don't throw error.
   * On order conflict (another device uploaded something) fetches updates, renumbers the queue and retries once.
   */
  tryUploadQueue(retryOnConflict = true) {
    return this.runSync(() => this.tryUploadQueueInternal(retryOnConflict));
  }

  private async tryUploadQueueInternal(retryOnConflict: boolean) {
    try {
      await this.performUpload();
    } catch (e) {
      const cause = e instanceof Error ? e.cause : undefined;
      if (retryOnConflict && isApiError(cause) && cause.status === 409) {
        logger.log('Journal order conflict, fetch updates and retry upload');
        if (!(await this.tryFetchUpdates())) return;
        await this.applyFetchedUpdates();
        await this.tryUploadQueueInternal(false);
      }
    }
  }
}

export const journalService = new JournalService();
