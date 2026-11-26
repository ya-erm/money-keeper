import { derived, get } from 'svelte/store';
import type { Participant } from './interfaces';
import { BaseService } from './service';
import { settingsService, settingsStore } from './settings';

class ParticipantsService extends BaseService<Participant> {
  constructor() {
    super('ParticipantsService', 'participants', 'participant');
  }
  get $participants() {
    return this.$items;
  }
  async select(id: string) {
    const settings = settingsService.settings;
    await settingsService.updateSettings({
      selectedParticipants: {
        ...settings.selectedParticipants,
        [settings.selectedMember ?? 'guest']: id,
      },
    });
  }
  async updatePreferences(value: Partial<Participant>) {
    const participant = get(selectedParticipantStore);
    if (participant) await this.save({ ...participant, ...value, id: participant.id });
  }
}
export const participantsService = new ParticipantsService();
export const participantsStore = participantsService.$participants;
export const selectedParticipantStore = derived(
  [participantsStore, settingsStore],
  ([items, settings]) =>
    items.find(
      (item) => item.id === settings.selectedParticipants?.[settings.selectedMember ?? 'guest'] && !item.archived,
    ) ?? null,
);

/** Keep participant names available on historical savings and wallet ownership. */
export const participantHistoryStore = derived(participantsStore, (items) => [
  ...items,
  ...participantsService.deletedItems,
]);
