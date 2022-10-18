export type Messages =
  | 'common.back'
  | 'common.select'
  | 'common.available_variants'
  | 'common.loading'
  | 'common.show_more'
  | 'common.sorting'
  | 'common.sort_by'
  | 'common.sort_direction'
  | 'common.ascending'
  | 'common.descending'
  | 'common.grouping'
  | 'auth.login'
  | 'auth.register'
  | 'accounts.title'
  | 'groups.title'
  | 'groups.create_group'
  | 'groups.users_count'
  | 'settings.title'
  | 'settings.common'
  | 'settings.language'
  | 'settings.select_language'
  | 'settings.darkMode';

export type Dictionary = { [key in Messages]: string };

export type Locales = 'ru-RU' | 'en-US';
