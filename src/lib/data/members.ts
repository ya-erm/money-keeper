import { store } from '$lib/store';
import { Logger } from '$lib/utils/logger';
import type { Initialisable, Member, MemberSettings } from './interfaces';
import { settingsService } from './settings';
import { useDB } from './useDB';

const logger = new Logger('MembersService', { disabled: false, color: '#00bbbb' });

export class MembersService implements Initialisable {
  // #region Private fields
  private _members = store<Member[]>([]);
  private _selectedMember = store<Member | null>(null);
  private _selectedMemberSettings = store<MemberSettings | null>(null);
  // #endregion

  // #region Public properties

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

  // #endregion

  // #region Public methods

  async init() {
    // Load from DB
    await this.loadFromDB();

    // Set selected member
    this.setSelectedMember();

    // Load selected member settings
    await this.loadSelectedMemberSettings();
  }

  /** Save one member to local DB amd memory */
  async save(item: Member) {
    const db = await useDB();
    db.put('members', item);
    this._members.update((prev) => prev.concat(item));

    // Set selected member
    if (!this.selectedMember) {
      this.setSelectedMember();
    }
  }

  /** @throws error if member is not selected */
  tryGetSelectedMember() {
    if (!this.selectedMember) {
      throw new Error('No member selected');
    }
    return this.selectedMember;
  }

  /** Update sync number */
  async updateSyncNumber(value: number) {
    logger.debug('SyncNumber:', value);
    this._selectedMemberSettings.update((prev) => ({ ...prev, syncNumber: value }));
    const member = this.tryGetSelectedMember();
    if (this.selectedMemberSettings) {
      const db = await useDB();
      await db.put('memberSettings', { ...this.selectedMemberSettings, owner: member.uuid });
    }
  }

  /** Update member settings */
  async updateSettings(settings: Partial<MemberSettings>) {
    this._selectedMemberSettings.update((prev) => {
      const newValue = { ...prev, ...settings } as MemberSettings;
      logger.debug('Update member settings:', { prev, new: newValue });
      return newValue;
    });
    const member = this.tryGetSelectedMember();
    if (this.selectedMemberSettings) {
      const db = await useDB();
      await db.put('memberSettings', { ...this.selectedMemberSettings, owner: member.uuid });
    }
  }

  /** Delete member */
  async deleteMember(member: Member) {
    const db = await useDB();
    await db.delete('members', member.uuid);
  }

  // #endregion

  /** Load all members from local DB to memory*/
  private async loadFromDB() {
    const db = await useDB();
    const items = await db.getAll('members');
    this._members.set(items);
  }

  /* Set selected member or choose first one */
  private setSelectedMember() {
    const uuid = settingsService.settings.selectedMember;
    const member = this.members.find((x) => x.uuid === uuid);
    if (member) {
      this._selectedMember.set(member);
    } else if (this.members.length > 0) {
      this._selectedMember.set(this.members[0]);
    }
  }

  /* Load selected member settings from local DB to memory */
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
}

export const membersService = new MembersService();
