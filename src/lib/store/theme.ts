import { storable } from './storable';

export const darkMode = storable(false, 'dark_mode');

export function toggleDarkMode() {
  darkMode.update((value) => !value);
}
