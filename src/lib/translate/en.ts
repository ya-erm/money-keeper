import { addMessages } from 'svelte-i18n';
import type { Dictionary } from './messages';

export const enDict: Dictionary = {
  'common.back': 'Back',
  'common.select': 'Select',
  'common.available_variants': 'Available variants',
  'common.loading': 'Loading...',
  'common.show_more': 'Show more',
  'common.sorting': 'Sorting',
  'common.sort_by': 'Sort by',
  'common.sort_direction': 'Sort direction',
  'common.ascending': 'Ascending',
  'common.descending': 'Descending',
  'common.grouping': 'Grouping',
  'auth.login': 'Log in',
  'auth.register': 'Register',
  'accounts.title': 'Accounts',
  'groups.title': 'Groups',
  'groups.users_count': '{count} users',
  'groups.create_group': 'Create group',
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.select_language': 'Select language',
  'settings.common': 'Common',
  'settings.darkMode': 'Dark mode',
};

addMessages('en-US', enDict);
