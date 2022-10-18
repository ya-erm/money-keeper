import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export const LS_PREFIX = 'mk_';

/**
 * Writable store, synchronised with local storage
 * @param defaultValue - default value
 * @param name - name in local storage
 */
export function storable<T>(defaultValue: T, name: string) {
  if (!browser) {
    return writable(defaultValue);
  }

  const json = localStorage?.getItem(`${LS_PREFIX}${name}`);
  const store = writable(json ? (JSON.parse(json) as T) : defaultValue);
  store.subscribe((value) => localStorage?.setItem(`${LS_PREFIX}${name}`, JSON.stringify(value)));
  return store;
}
