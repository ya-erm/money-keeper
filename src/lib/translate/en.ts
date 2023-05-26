import { addMessages } from 'svelte-i18n';
import type { Dictionary } from './messages';

export const enDict: Dictionary = {
  'app.title': 'Money Keeper',
  // Common
  'common.back': 'Back',
  'common.select': 'Select',
  'common.accept': 'Accept',
  'common.available_variants': 'Available variants',
  'common.optional': 'optional',
  'common.loading': 'Loading...',
  'common.show_more': 'Show more',
  'common.sorting': 'Sorting',
  'common.sort_by': 'Sort by',
  'common.sort_direction': 'Sort direction',
  'common.ascending': 'Ascending',
  'common.descending': 'Descending',
  'common.grouping': 'Grouping',
  'common.no_items': 'No items yet',
  'common.nothing_found': 'Nothing found',
  'common.create': 'Create',
  'common.save': 'Save',
  'common.add': 'Add',
  'common.save_changes_failure': 'Failed to save changes',
  'common.save_changes_success': 'Changes were saved',
  'common.search': 'Search',
  'common.clear': 'Clear',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.ok': 'OK',
  'common.continue': 'Continue',
  // Tags
  'tags.add_modal_header': 'Add tag',
  'tags.edit_modal_header': 'Edit tag',
  'tags.title': 'Title',
  'tags.delete_tag': 'Delete tag',
  'tags.add_tag_failure': 'Failed to add tag',
  'tags.edit_tag_failure': 'Failed to edit tag',
  'tags.delete_tag_failure': 'Failed to delete tag',
  // Language
  'language.select_language': 'Select language',
  // Auth
  'auth.login.title': 'Login',
  'auth.login': 'Login',
  'auth.password': 'Password',
  'auth.sign_in': 'Sign in',
  'auth.incorrect_login_or_password': 'Incorrect login or password',
  'auth.incorrect_old_password': 'Incorrect old password',
  'auth.failed_to_login': 'Failed to login',
  'auth.register.title': 'Register',
  'auth.name': 'Name',
  'auth.phone': 'Phone',
  'auth.old_password': 'Old password',
  'auth.new_password': 'New password',
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
  'accounts.list': 'Account list',
  'accounts.title': 'Accounts',
  'accounts.new_account': 'New account',
  'accounts.create_account': 'Create account',
  'accounts.create_account_failure': 'Failed to create account',
  'accounts.create_account_success': 'Account was created',
  'accounts.edit_account': 'Update account',
  'accounts.delete_account': 'Delete account',
  'accounts.delete_account_confirm': 'Are you sure want to delete account?',
  'accounts.delete_account_confirm_description':
    "All account's operations also will be deleted. This action can't be undone.",
  'accounts.delete_account_failure': 'Failed to delete account',
  'accounts.delete_account_success': 'Account was deleted',
  'accounts.name': 'Name',
  'accounts.currency': 'Currency',
  'accounts.icon': 'Icon',
  'accounts.color': 'Color',
  'accounts.order': 'Order number',
  // Categories
  'categories.title': 'Categories',
  'categories.incomings': 'Incomings',
  'categories.outgoings': 'Outgoings',
  'categories.new_category': 'New category',
  'categories.create_category': 'Create category',
  'categories.create_category_success': 'Category was created',
  'categories.create_category_failure': 'Failed to create category',
  'categories.edit_category': 'Edit category',
  'categories.delete_category': 'Delete category',
  'categories.delete_category_failure': 'Failed to delete category',
  'categories.delete_category_success': 'Category was deleted',
  'categories.name': 'Name',
  'categories.icon': 'Icon',
  // Groups
  'groups.title': 'Groups',
  'groups.create_group': 'Create group',
  'groups.name': 'Name',
  'groups.edit_group': 'Edit group',
  'groups.edit_group_name': "Edit group's name",
  'groups.users': 'Users',
  'groups.add_user': 'Add user',
  'groups.failed_to_add_user': 'Failed to add user',
  'groups.username': 'Username',
  'groups.delete_user_confirm': 'Are you sure want to exclude user?',
  'groups.delete_user_confirm_description':
    'User will loss access to accounts, categories and operations in this group.',
  'groups.delete_user': 'Exclude',
  'groups.failed_to_delete_user': 'Failed to exclude user from group',
  'groups.delete_group': 'Delete group',
  'groups.delete_group_confirm': 'Are you sure want to delete group?',
  'groups.delete_group_confirm_description':
    "All accounts, categories and operations will be deleted. This action can' be undone.",
  'groups.failed_to_delete_group': 'Failed to delete group',
  // Transactions
  'transactions.title': 'Operations',
  'transactions.create_transaction': 'Create operation',
  'transactions.new_transaction': 'New operation',
  'transactions.incoming': 'Incoming',
  'transactions.outgoing': 'Outgoing',
  'transactions.transfer': 'Transfer',
  'transactions.from': 'From',
  'transactions.to': 'To',
  'transactions.account': 'Account',
  'transactions.account_is_required': 'Select an account firstly',
  'transactions.destination_account_is_required': 'Select an destination account firstly',
  'transactions.accounts_must_be_different': 'Select different accounts',
  'transactions.date': 'Date',
  'transactions.time': 'Time',
  'transactions.dateTime': 'Date and time',
  'transactions.amount': 'Amount',
  'transactions.category': 'Category',
  'transactions.category_is_required': 'Select a category firstly',
  'transactions.comment': 'Comment',
  'transactions.tags': 'Tags',
  'transactions.edit_transaction': 'Edit operation',
  'transactions.create_transaction_success': 'Operation was created',
  'transactions.create_transaction_failure': 'Failed to create operation',
  'transactions.delete_transaction': 'Delete operation',
  'transactions.delete_transaction_success': 'Operation was deleted',
  'transactions.delete_transaction_failure': 'Failed to delete operation',
  // Transactions import
  'transactions.import': 'Import',
  'transactions.import.title': 'Import operations',
  'transactions.import.invalid_expression': 'Enter search request to filter operations of one category',
  'transactions.import.no_category': 'No category',
  'transactions.import.set_category': 'Set category',
  'transactions.import.select_category_title': 'Select category',
  'transactions.import.select_category_multi_title':
    'Select category for {count, plural, =1 {# operation} other {# operations}}',
  'transactions.import.apply': 'Apply category',
  'transactions.import.category_applied':
    'Category "{category}" applied for {count, plural, =1 {# operation} other {# operations}}',
  'transactions.import.select_category_for_all_operations': 'Select categories for all operations',
  'transactions.import.finish': 'Finish import',
  'transactions.import.finished': '{count, plural, one {# operation was imported} other {# operations were imported}}',
  // Import rules
  'transactions.import.rules.title': 'Rules of import',
  'transactions.import.rules.create': 'Create rule',
  'transactions.import.rules.edit_rule': 'Edit rule',
  'transactions.import.rules.how_does_it_work': 'How does it work?',
  'transactions.import.rules.how_does_it_work.description':
    'If the description of the operation satisfies the search condition, then the selected category will be assigned to the operation and the selected tags will be added to it',
  'transactions.import.rules.condition': 'Search condition',
  'transactions.import.rules.category': 'Category',
  'transactions.import.rules.tags': 'Tags',
  'transactions.import.rules.category_or_tags_required': 'Select category or/and tags firstly',
  'transactions.import.rules.save_rule_success': 'Rule was saved',
  'transactions.import.rules.save_rule_failure': 'Failed to save rule',
  'transactions.import.rules.delete': 'Delete rule',
  'transactions.import.rules.delete_success': 'Rule was deleted',
  'transactions.import.rules.delete_failure': 'Failed to delete rule',
  // System
  'system.category.transfer_in': 'Transfer from other account',
  'system.category.transfer_out': 'Transfer to other account',
  // Currency rates
  'currency_rates.title': 'Currency rates',
  'currency_rates.default_currency': 'Main currency',
  'currency_rates.new_currency_rate': 'New currency rate',
  'currency_rates.currency1': 'Currency 1',
  'currency_rates.currency2': 'Currency 2',
  'currency_rates.rate': 'Rate',
  'currency_rates.delete_currency_rate': 'Delete currency rate',
  'currency_rates.delete_currency_rate_success': 'Currency rate was deleted',
  'currency_rates.delete_currency_rate_failure': 'Failed to delete currency rate',
  // Settings
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.select_language': 'Select language',
  'settings.common': 'Common',
  'settings.darkMode': 'Dark mode',
  'settings.theme': 'Theme',
  'settings.theme.light': 'Light',
  'settings.theme.dark': 'Dark',
  'settings.theme.system': 'System',
  'settings.import_export': 'Import / Export',
  'settings.profile': 'Profile',
  'settings.profile.change_name': 'Change name',
  'settings.profile.change_name_failure': 'Failed to change name',
  'settings.profile.change_login': 'Change login',
  'settings.profile.change_login_failure': 'Failed to change login',
  'settings.profile.change_password': 'Change password',
  'settings.profile.change_password_success': 'Password was changed',
  'settings.profile.change_password_failure': 'Failed to change password',
  'settings.profile.change_workspace': 'Select workspace',
  'settings.profile.change_workspace_failure': 'Failed to select workspace',
  'settings.profile.logout': 'Log out',
  'settings.collaboration': 'Collaboration',
  'settings.collaboration.workspace': 'Workspace',
  'settings.collaboration.workspaces': 'Workspaces',
  'settings.collaboration.invites': 'Invites',
  'settings.collaboration.blocklist': 'Blocklist',
  'settings.encryption': 'Encryption',
  'settings.report_problem': 'Report a problem',
  'settings.version': 'Version: {version}',
  'settings.uikit': 'UI Kit',
};

addMessages('en-US', enDict);
