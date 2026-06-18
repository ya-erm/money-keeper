import { writable } from 'svelte/store';

export type AnalyticsBalancesVisibilityMode = 'auto' | 'show' | 'hide';

export const analyticsBalancesVisibilityMode = writable<AnalyticsBalancesVisibilityMode>('auto');

export function resetAnalyticsBalancesVisibility() {
  analyticsBalancesVisibilityMode.set('auto');
}
