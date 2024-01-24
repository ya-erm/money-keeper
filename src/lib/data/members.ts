import { store } from '$lib/store';
import { Logger } from '$lib/utils/logger';
import type { Initialisable, JournalItem, JournalSubscriber, Member, MemberSettings } from './interfaces';
import { journalService } from './journal';
import { settingsService } from './settings';
import { useDB } from './useDB';

const logger = new Logger('MembersService', { disabled: false, color: '#00bbbb' });

const GUEST_UUID = 'guest';

const guest: Member = {
  login: 'guest',
  uuid: GUEST_UUID,
  publicKey: '',
  privateKey: '',
};

export class MembersService implements Initialisable, JournalSubscriber {
  // #region Private fields
  private _members = store<Member[]>([]);
  private _selectedMember = store<Member | null>(null);
  private _selectedMemberSettings = store<MemberSettings | null>(null);
  // #endregion

  // #region Public properties

  name = 'MembersService';

  /** List of all available members */
  get members() {
    return this._members.value;
  }

  /** Readable store of all available members */
  get $members() {
    return this._members.readable;
  }

  /** Selected member */
  get selectedMember() {
    return this._selectedMember.value;
  }

  /** Readable store of selected member */
  get $selectedMember() {
    return this._selectedMember.readable;
  }

  /** Selected member settings */
  get selectedMemberSettings() {
    return this._selectedMemberSettings.value;
  }

  /** Readable store of selected member settings */
  get $selectedMemberSettings() {
    return this._selectedMemberSettings;
  }

  /** Selected member is guest */
  get isGuest() {
    return this.selectedMember?.uuid === GUEST_UUID;
  }

  // #endregion

  // #region Public methods

  async init() {
    // Load from DB
    await this.loadFromDB();

    // Choose selected member
    this.chooseSelectedMember();

    // Load selected member settings
    await this.loadSelectedMemberSettings();
  }

  /** Save one member to local DB and memory */
  async save(item: Member) {
    const db = await useDB();
    await db.put('members', item);
    this._members.update((prev) => prev.concat(item));
  }

  /** @throws error if member is not selected */
  getSelectedMember() {
    if (!this.selectedMember) {
      throw new Error('No member selected');
    }
    return this.selectedMember;
  }

  /** Update sync number */
  async updateSyncNumber(value: number) {
    logger.debug('updateSyncNumber', { value });
    await this.updateSettings({ syncNumber: value });
  }

  /** Update member settings and optional save to DB */
  async updateSettings(settings: Partial<MemberSettings>, saveToDB: boolean = true) {
    await this.updateSettingsInMemory(settings);
    if (saveToDB) {
      const member = this.getSelectedMember();
      if (this.selectedMemberSettings) {
        const db = await useDB();
        await db.put('memberSettings', { ...this.selectedMemberSettings, owner: member.uuid });
      }
    }
  }

  /** Delete member */
  async deleteMember(member: Member) {
    const db = await useDB();
    await db.delete('members', member.uuid);
  }

  /** Save accounts order */
  saveAccountsOrder(accountsOrder: string[]) {
    void journalService.addOperationToQueue({ accountsOrder });
    void this.updateSettingsInMemory({ accountsOrder });
  }

  /** Apply journal updates and optional save to DB */
  async applyChanges(changes: JournalItem[], saveToDB: boolean) {
    const accountsOrder = changes.findLast((item) => item.data.accountsOrder);
    if (accountsOrder) {
      await this.updateSettings({ accountsOrder: accountsOrder.data.accountsOrder }, saveToDB);
    }
  }

  /* Get selected member from settings or select a guest */
  chooseSelectedMember() {
    const uuid = settingsService.settings.selectedMember;
    const member = this.members.find((x) => x.uuid === uuid);
    this._selectedMember.set(member ?? guest);
    logger.debug('Selected member:', this.selectedMember?.login);
  }

  // #endregion

  /** Load all members from local DB to memory*/
  private async loadFromDB() {
    const db = await useDB();
    const items = await db.getAll('members');

    this._members.set([guest, ...items]);
  }

  /* Load selected member's settings from local DB to memory */
  private async loadSelectedMemberSettings() {
    if (!this.selectedMember) {
      return;
    }
    const db = await useDB();
    const settings = await db.get('memberSettings', this.selectedMember.uuid);
    if (settings) {
      this._selectedMemberSettings.set(settings);
    }
  }

  /* Update settings in memory */
  private async updateSettingsInMemory(settings: Partial<MemberSettings>) {
    this._selectedMemberSettings.update((prev) => {
      const newValue = { ...prev, ...settings } as MemberSettings;
      logger.debug('Update member settings:', { prev, new: newValue });
      return newValue;
    });
  }
}

export const membersService = new MembersService();

export const membersStore = membersService.$members;
export const selectedMemberStore = membersService.$selectedMember;
export const memberSettingsStore = membersService.$selectedMemberSettings;
