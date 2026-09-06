import { readable } from 'svelte/store';

import { browser } from '$app/environment';

/** Reactive `window.matchMedia` result, always `false` during SSR */
export function createMediaQuery(query: string) {
  return readable(false, (set) => {
    if (!browser) return;
    const mediaQuery = window.matchMedia(query);
    set(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => set(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  });
}

/** Wide screen: enough room for a list and a details pane side by side */
export const isWideScreen = createMediaQuery('(min-width: 1200px)');
