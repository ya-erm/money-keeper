/* eslint-disable no-console */

import { openDB } from 'idb';
import type { LocalDB } from './interfaces';

const CURRENT_VERSION = 4;

export async function useDB() {
  return await openDB<LocalDB>('mk-2', CURRENT_VERSION, {
    upgrade(db, oldVersion, newVersion) {
      console.debug('Upgrading DB', { oldVersion, newVersion });

      function migration(version: number, description: string, action: () => void) {
        if (oldVersion < version && db.version >= version) {
          console.debug(`Migration ${version}: ${description}`);
          action();
        }
      }

      migration(1, 'Creating members store', () => {
        db.createObjectStore('members', { keyPath: 'uuid' });
      });

      migration(2, 'Creating journal store', () => {
        const objectStore = db.createObjectStore('journal', { keyPath: ['owner', 'order'] });
        objectStore.createIndex('by-owner', 'owner');
      });

      migration(3, 'Creating categories store', () => {
        const objectStore = db.createObjectStore('categories', { keyPath: 'id' });
        objectStore.createIndex('by-owner', 'owner');
      });

      migration(4, 'Creating settings stores', () => {
        db.createObjectStore('globalSettings', { keyPath: 'id' });
        db.createObjectStore('memberSettings', { keyPath: 'owner' });
      });
    },
  });
}
