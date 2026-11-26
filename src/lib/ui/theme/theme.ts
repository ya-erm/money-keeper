import { browser } from '$app/env';
import { derived, get, writable, type Writable } from 'svelte/store';
import { createMediaQuery } from '#lib/ui/layout/media.js';

export type ThemePreference = 'light' | 'dark' | 'system';

function storedPreference(): ThemePreference {
  if (!browser) return 'system';
  try {
    try {
      const preference: unknown = JSON.parse(localStorage.getItem('mk_theme') ?? 'null');
      if (preference === 'light' || preference === 'dark' || preference === 'system') return preference;
    } catch {
      // Fall back to the previous boolean setting if the preference is malformed.
    }
    const legacy = localStorage.getItem('mk_dark_mode');
    if (legacy === 'true') return 'dark';
    if (legacy === 'false') return 'light';
  } catch {
    // The system theme remains usable when storage is unavailable.
  }
  return 'system';
}

export const themePreference = writable<ThemePreference>(storedPreference());
if (browser) {
  themePreference.subscribe((value) => {
    try {
      localStorage.setItem('mk_theme', JSON.stringify(value));
    } catch {
      // A theme change should still apply when browser storage is unavailable.
    }
  });
}

const systemDarkMode = createMediaQuery('(prefers-color-scheme: dark)');
const resolvedDarkMode = derived([themePreference, systemDarkMode], ([preference, systemDark]) =>
  preference === 'system' ? systemDark : preference === 'dark',
);

/** Keep the existing boolean control API for the UI kit and callers that explicitly toggle the theme. */
export const darkMode: Writable<boolean> = {
  subscribe: resolvedDarkMode.subscribe,
  set: (value) => themePreference.set(value ? 'dark' : 'light'),
  update: (updater) => themePreference.set(updater(get(resolvedDarkMode)) ? 'dark' : 'light'),
};

export function toggleDarkMode() {
  darkMode.update((value) => !value);
}
