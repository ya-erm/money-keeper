import { store } from '$lib/store';
import type { GlobalSettings, Initialisable } from './interfaces';
import { useDB } from './useDB';

const defaultSettings: GlobalSettings = {
  id: 'global',
};

export class GlobalSettingsService implements Initialisable {
  private _settings = store<GlobalSettings>(defaultSettings);

  get settings() {
    return this._settings.value;
  }

  get $settings() {
    return this._settings.readable;
  }

  async init() {
    await this.loadFromDB();
  }

  private async loadFromDB() {
    const db = await useDB();
    const settings = await db.get('globalSettings', 'global');
    this._settings.set(settings ?? defaultSettings);
  }

  async saveToDB() {
    const db = await useDB();
    await db.put('globalSettings', this.settings);
  }
}

export const settingsService = new GlobalSettingsService();

export const settingsStore = settingsService.$settings;
