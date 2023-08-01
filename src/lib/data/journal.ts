import type {
  GetJournalResponse,
  PostManyJournalRequestData,
  PostManyJournalResponseData,
} from '$lib/server/api/v2/journal';
import type { GetJournalRequest } from '$lib/server/api/v2/journal/getJournal';
import { store } from '$lib/store';
import { unexpectedCase } from '$lib/utils';
import { Logger } from '$lib/utils/logger';
import { useFetch } from '$lib/utils/useFetch';

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
  async init() {
    this._syncNumber.subscribe((value) => value >= 0 && membersService.updateSyncNumber(value));

    logger.log('Load outgoing queue from local DB');
    await this.loadQueueFromDB();

    if (this.queue.length > 0) {
      logger.log('Apply queue to subscribers');
      await this.applyChangesToSubscribers(this.queue, false);
    }
  }

  /** Synchronize updates with server */
  async syncWithServer() {
    logger.log('Fetch updates from server, sync number:', this.syncNumber);
    await this.tryFetchUpdates();

    if (this.queue.length > 0 && this.updates.length > 0) {
      logger.log(`Warning. Incoming: ${this.updates.length}, outgoing: ${this.queue.length}. Conflicts may be ocurred`);
    }

    if (this.updates.length > 0) {
      logger.log('Apply updates to subscribers');
      await this.applyChangesToSubscribers(this.updates, true);
    }

    if (this.queue.length > 0) {
      logger.log('Upload queue to server');
      await this.tryUploadQueue();
    }
  }

  /** Apply changes to subscribers */
  private async applyChangesToSubscribers(changes: JournalItem[], saveToDB: boolean) {
    if (changes.length === 0) return;
    const subscribers = Array.from(this._subscribers.values());
    await Promise.all(subscribers.map((subscriber) => subscriber.applyChanges(changes, saveToDB)));
  }

  /** Fetch updates updates from server */
  private async fetchUpdates() {
    // await new Promise<void>((resolve) => setTimeout(() => resolve(), 5000));
    const fetcher = useFetch<GetJournalRequest, GetJournalResponse>('POST', '/api/v2/journal/get-updates');
    const { journal } = await fetcher.fetch({ start: this.syncNumber });
    const member = membersService.tryGetSelectedMember();
    const privateKey = JSON.parse(member.privateKey) as JsonWebKey;
    const items = await Promise.all(
      journal.map(async (item) => {
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
    items.sort((a, b) => a.order - b.order);
    logger.debug('Updates:', items);
    if (items.length > 0) {
      this._syncNumber.set(items[items.length - 1].order);
    }
    this._updates.set(items);
  }

  /** Try fetch updates from server, don't throw error */
  private async tryFetchUpdates() {
    try {
      this._state.set('downloading');
      await this.fetchUpdates();
    } catch (e) {
      logger.error('Failed to fetch updates', e);
    } finally {
      this._state.set('idle');
    }
  }

  /** Load queue from local database */
  private async loadQueueFromDB() {
    const db = await useDB();
    const member = membersService.tryGetSelectedMember();
    const settings = membersService.selectedMemberSettings;
    if (settings?.syncNumber) {
      this._syncNumber.set(settings?.syncNumber);
    }
    const items = await db.getAllFromIndex('journal', 'by-owner', member.uuid);
    this._queue.set(items);
  }

  /** Add operation to queue (in memory) and try to upload it */
  async addOperationToQueue(operation: JournalOperation, options?: { upload: boolean }) {
    const item: JournalItem = {
      order: this.syncNumber + this._queue.value.length + 1,
      data: operation,
    };
    this._queue.update((prev) => prev.concat(item));

    // Save to DB
    const db = await useDB();
    const member = membersService.tryGetSelectedMember();
    await db.put('journal', { ...item, owner: member.uuid });

    if (options?.upload ?? true) {
      // Try run upload asynchronously
      this.tryUploadQueue();
    }
  }

  /** Clear queue */
  private async clearQueue() {
    this._queue.set([]);
    const db = await useDB();
    await db.clear('journal');
  }

  /** Upload queue to the server */
  private async uploadQueue() {
    // TODO: optimize queue before upload

    logger.log('Uploading queue: ', this.queue.length);
    logger.debug('Queue: ', this.queue);

    // TODO: pull and merge conflicts firstly

    if (this.queue.some((x) => x.order <= this.syncNumber)) {
      logger.log('Reorder queue');
      const reorderedItems = this.queue.map((item, i) => ({ ...item, order: this.syncNumber + i + 1 }));
      this._queue.set(reorderedItems);
    }

    const member = membersService.tryGetSelectedMember();
    const encryption = membersService.selectedMemberSettings?.encryption ?? 'none';
    const publicKey = JSON.parse(member.publicKey) as JsonWebKey;

    const items = await Promise.all(
      this.queue.map(async (item) => {
        const json = JSON.stringify(item.data);
        switch (encryption) {
          case 'none':
            return {
              order: item.order,
              encryption,
              data: json,
            };
          case 'aes+rsa-v1': {
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

    const json = await useFetch<PostManyJournalRequestData, PostManyJournalResponseData>(
      'POST',
      '/api/v2/journal',
    ).fetch({ items });

    logger.log('Queue uploaded successfully.', 'New sync number:', json.syncNumber);
    if (json.syncNumber) this._syncNumber.set(json.syncNumber);

    // TODO: move from this function for single responsibility
    logger.log('Applying changes from queue to subscribers');
    await this.applyChangesToSubscribers(this.queue, true);

    this.clearQueue();
  }

  /** Try to upload queue to the server, don't throw error */
  async tryUploadQueue() {
    try {
      if (this.queue.length > 0) {
        this._state.set('uploading');
        await this.uploadQueue();
      }
    } catch (e) {
      logger.error('Error while uploading queue', e);
    } finally {
      this._state.set('idle');
    }
  }
}

export const journalService = new JournalService();
