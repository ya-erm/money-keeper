import { onDestroy, type SvelteComponent } from 'svelte';
import { writable } from 'svelte/store';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Component = typeof SvelteComponent | any;

export const title = writable<string | null>();

export const backLink = writable<string | null>();
export const backLinkTitle = writable<string | null>();

export const leftButton = writable<Component | null>();
export const rightButton = writable<Component | null>();

/** Set title and clear it on destroy */
export function useTitle(value: string) {
  title.set(value);
  onDestroy(() => title.set(null));
}

/** Set right button and clear it on destroy */
export function useRightButton(value: Component) {
  rightButton.set(value);
  onDestroy(() => rightButton.set(null));
}

/** Set left button and clear it on destroy */
export function useLeftButton(value: Component) {
  leftButton.set(value);
  onDestroy(() => leftButton.set(null));
}

/** Set back button (with optional custom title) and clear it on destroy */
export function useBackButton(route: string, title?: string) {
  backLink.set(route);
  backLinkTitle.set(title ?? null);
  onDestroy(() => {
    backLink.set(null);
    backLinkTitle.set(null);
  });
}
