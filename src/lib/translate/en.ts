import { addMessages } from 'svelte-i18n';
import type { Dictionary } from './messages';

export const enDict: Dictionary = {
  // Common
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
  'common.no_items': 'No items yet',
  'common.create': 'Create',
  'common.save': 'Save',
  'common.add': 'Add',
  'common.failed_to_save_changes': 'Failed to save changes',
  // Auth
  'auth.login.title': 'Login',
  'auth.login': 'Login',
  'auth.password': 'Password',
  'auth.sign_in': 'Sign in',
  'auth.incorrect_login_or_password': 'Incorrect login or password',
  'auth.failed_to_login': 'Failed to login',
  'auth.register.title': 'Register',
  'auth.name': 'Name',
  'auth.phone': 'Phone',
  'auth.repeat_password': 'Repeat password',
  'auth.passwords_must_be_same': 'Passwords must be same',
  'auth.register': 'Sign up',
  'auth.user_already_exists': 'User already exists',
  'auth.failed_to_register': 'Failed to register',
  'auth.logout.title': 'Logout',
  'auth.sign_out': 'Sign out',
  'auth.profile': 'Profile',
  'auth.logged_in_as': 'You are logged in as {name}!',
  'auth.not_logged_in': 'You are not logged in',
  // Accounts
  'accounts.title': 'Accounts',
  // Groups
  'groups.title': 'Groups',
  'groups.create_group': 'Create group',
  'groups.name': 'Название',
  'groups.edit_group_name': 'Редактирование название группы',
  'groups.users': 'Пользователи',
  'groups.add_user': 'Добавить пользователя',
  'groups.failed_to_add_user': 'Не удалось добавить пользователя',
  'groups.username': 'Имя пользователя',
  'groups.delete_group': 'Удалить группу',
  // Settigns
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.select_language': 'Select language',
  'settings.common': 'Common',
  'settings.darkMode': 'Dark mode',
};

addMessages('en-US', enDict);
