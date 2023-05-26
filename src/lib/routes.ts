import type { Messages } from '$lib/translate';

type Route = {
  path: string;
  title: Messages;
};

type RouteKey =
  | 'root'
  | 'login'
  | 'logout'
  | 'register'
  | 'profile'
  | 'groups'
  | 'groups.create'
  | 'accounts'
  | 'accounts.create'
  | 'accounts.list'
  | 'categories'
  | 'categories.create'
  | 'transactions'
  | 'transactions.create'
  | 'transactions.import'
  | 'transactions.import.rules'
  | 'transactions.import.rules.create'
  | 'settings'
  | 'settings.language'
  | 'settings.currency_rates'
  | 'settings.encryption'
  | 'uikit';

export const routes: { [key in RouteKey]: Route } = {
  root: {
    path: '/v1/',
    title: 'settings.title',
  },
  login: {
    path: '/v1/login',
    title: 'auth.login.title',
  },
  logout: {
    path: '/v1/logout',
    title: 'auth.logout.title',
  },
  register: {
    path: '/v1/register',
    title: 'auth.register',
  },
  profile: {
    path: '/v1/profile',
    title: 'auth.profile',
  },
  groups: {
    path: '/v1/settings/groups',
    title: 'groups.title',
  },
  'groups.create': {
    path: '/v1/settings/groups/create',
    title: 'groups.create_group',
  },
  accounts: {
    path: '/v1/accounts',
    title: 'accounts.title',
  },
  'accounts.create': {
    path: '/v1/accounts/create',
    title: 'accounts.create_account',
  },
  'accounts.list': {
    path: '/v1/accounts/list',
    title: 'accounts.title',
  },
  categories: {
    path: '/v1/categories',
    title: 'categories.title',
  },
  'categories.create': {
    path: '/v1/categories/create',
    title: 'categories.create_category',
  },
  transactions: {
    path: '/v1/transactions',
    title: 'transactions.title',
  },
  'transactions.create': {
    path: '/v1/transactions/create',
    title: 'transactions.new_transaction',
  },
  'transactions.import': {
    path: '/v1/transactions/import',
    title: 'transactions.import.title',
  },
  'transactions.import.rules': {
    path: '/v1/transactions/import/rules',
    title: 'transactions.import.rules.title',
  },
  'transactions.import.rules.create': {
    path: '/v1/transactions/import/rules/create',
    title: 'transactions.import.rules.create',
  },
  settings: {
    path: '/v1/settings',
    title: 'settings.title',
  },
  'settings.language': {
    path: '/v1/settings/language',
    title: 'settings.select_language',
  },
  'settings.currency_rates': {
    path: '/v1/settings/currency-rates',
    title: 'currency_rates.title',
  },
  'settings.encryption': {
    path: '/v1/settings/encryption',
    title: 'settings.encryption',
  },
  uikit: {
    path: '/v1/uikit',
    title: 'settings.uikit',
  },
};

export function findRoute(path: string) {
  return Object.values(routes).find((route) => route.path == path);
}

export function route(key: RouteKey) {
  return '/v2' + routes[key].path;
}
