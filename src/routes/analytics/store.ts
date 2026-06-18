import { writable } from 'svelte/store';

export const showHiddenAnalyticsBalances = writable(false);
export const hideVisibleAnalyticsBalances = writable(false);

export function resetAnalyticsBalancesVisibility() {
  showHiddenAnalyticsBalances.set(false);
  hideVisibleAnalyticsBalances.set(false);
}
