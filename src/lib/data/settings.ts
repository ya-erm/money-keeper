import { store } from '$lib/store';
import { Logger } from '$lib/utils/logger';
import type { GlobalSettings, Initialisable } from './interfaces';
import { useDB } from './useDB';

const logger = new Logger('GlobalSettings', { disabled: false });

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

  async updateSettings(value: Partial<GlobalSettings>) {
    this._settings.update((prev) => {
      const newValue = { ...this.settings, ...value };
      logger.debug('Update global settings', { prev, newValue });
      return newValue;
    });
    await this.saveToDB();
  }
}

export const settingsService = new GlobalSettingsService();

export const settingsStore = settingsService.$settings;
