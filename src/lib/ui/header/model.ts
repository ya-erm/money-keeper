import { onDestroy, type SvelteComponent } from 'svelte';
import { writable } from 'svelte/store';

export const title = writable<string | null>();

export const backLink = writable<string | null>();

export const leftButton = writable<typeof SvelteComponent | null>();
export const rightButton = writable<typeof SvelteComponent | null>();

/** Set title and clear it on destroy */
export function useTitle(value: string) {
  title.set(value);
  onDestroy(() => title.set(null));
}

/** Set right button and clear it on destroy */
export function useRightButton(value: typeof SvelteComponent) {
  rightButton.set(value);
  onDestroy(() => rightButton.set(null));
}

/** Set left button and clear it on destroy */
export function useLeftButton(value: typeof SvelteComponent) {
  leftButton.set(value);
  onDestroy(() => leftButton.set(null));
}
