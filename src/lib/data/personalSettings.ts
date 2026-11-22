import { derived } from 'svelte/store';
import { memberSettingsStore } from './members';
import { selectedParticipantStore } from './participants';

export const personalSettingsStore = derived(
  [memberSettingsStore, selectedParticipantStore],
  ([settings, participant]) => {
    if (!settings && !participant) return null;
    return {
      ...settings,
      syncNumber: settings?.syncNumber ?? -1,
      accountsOrder: participant?.accountsOrder ?? settings?.accountsOrder,
      currency: participant?.currency ?? settings?.currency,
    };
  },
);
