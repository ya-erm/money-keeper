import { store } from '$lib/store';
import type { Account, Initialisable, JournalItem, JournalSubscriber } from './interfaces';
import type { JournalService } from './journal';
import type { MembersService } from './members';
import { useDB } from './useDB';

export class AccountsService implements Initialisable, JournalSubscriber {
  private _accounts = store<Account[]>([]);

  /** Constructor */
  constructor(private _journalService: JournalService, private _membersService: MembersService) {}

  /** List of all accounts */
  get accounts() {
    return this._accounts.value;
  }

  /** Readable store of all accounts */
  get $accounts() {
    return this._accounts.readable;
  }

  /** Service name */
  get name() {
    return 'AccountsService';
  }

  /** Initialisation */
  async init() {
    await this.loadFromDB();
  }

  /** Load accounts from local DB to memory */
  private async loadFromDB() {
    const db = await useDB();
    const member = this._membersService.tryGetSelectedMember();
    const items = await db.getAllFromIndex('accounts', 'by-owner', member.uuid);
    this._accounts.set(items.filter((x) => !x.deleted));
  }

  /** Save one item to local DB */
  private async saveToDB(item: Account) {
    const db = await useDB();
    const member = this._membersService.tryGetSelectedMember();
    await db.put('accounts', { ...item, owner: member.uuid });
  }

  /** Apply journal updates and optional save to DB */
  async applyChanges(changes: JournalItem[], saveToDB: boolean) {
    const updates = new Map<string, Account>();
    changes.forEach((item) => item.data.account && updates.set(item.data.account.id, item.data.account));
    const items = Array.from(updates.values());

    this._accounts.update((prev) => {
      const dict = new Map<string, Account>();
      prev.forEach((item) => dict.set(item.id, item));
      items.forEach((item) => dict.set(item.id, item));
      return Array.from(dict.values()).filter((x) => !x.deleted);
    });

    if (saveToDB) {
      await Promise.all(items.map((item) => this.saveToDB(item)));
    }
  }

  /** Save account */
  save(item: Account) {
    // Add operation to queue
    this._journalService.addOperationToQueue({ account: item });
    // Apply changes in memory
    this._accounts.update((prev) => {
      return prev.findIndex((x) => x.id === item.id) >= 0
        ? prev.map((x) => (x.id === item.id ? item : x))
        : prev.concat(item);
    });
  }

  /** Delete account */
  delete(item: Account) {
    // TODO: delete all transactions with this account
    // Add operation to queue
    this._journalService.addOperationToQueue({ account: { ...item, deleted: true } });
    // Apply changes in memory
    this._accounts.update((prev) => prev.filter((x) => x.id !== item.id));
  }
}
