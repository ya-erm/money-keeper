import { openDB } from 'idb';
import type { LocalDB } from './interfaces';

const CURRENT_VERSION = 1;

export async function useDB() {
  return await openDB<LocalDB>('mk-2', CURRENT_VERSION, {
    upgrade(db) {
      console.debug('upgrade DB', { version: db.version, newVersion: CURRENT_VERSION });
      if (db.version <= 1) {
        db.createObjectStore('categories', { keyPath: 'id' });
      }
    },
  });
}
