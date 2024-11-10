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
  | 'analytics'
  | 'analytics.accounts'
  | 'analytics.accounts.groupings'
  | 'analytics.accounts.groupings.edit'
  | 'analytics.balance'
  | 'analytics.categories'
  | 'categories'
  | 'categories.create'
  | 'repeatings'
  | 'transactions'
  | 'transactions.create'
  | 'transactions.import'
  | 'transactions.import.rules'
  | 'transactions.import.rules.create'
  | 'settings'
  | 'settings.language'
  | 'settings.currency_rates'
  | 'settings.encryption'
  | 'settings.import_export'
  | 'settings.logs'
  | 'uikit';

export const routes: { [key in RouteKey]: Route } = {
  root: {
    path: '/',
    title: 'app.title',
  },
  login: {
    path: '/login',
    title: 'auth.login.title',
  },
  logout: {
    path: '/logout',
    title: 'auth.logout.title',
  },
  register: {
    path: '/register',
    title: 'auth.register.title',
  },
  profile: {
    path: '/profile',
    title: 'auth.profile',
  },
  groups: {
    path: '/settings/groups',
    title: 'groups.title',
  },
  'groups.create': {
    path: '/settings/groups/create',
    title: 'groups.create_group',
  },
  accounts: {
    path: '/accounts',
    title: 'accounts.title',
  },
  'accounts.create': {
    path: '/accounts/create',
    title: 'accounts.create_account',
  },
  'accounts.list': {
    path: '/accounts/list',
    title: 'accounts.title',
  },
  analytics: {
    path: '/analytics',
    title: 'analytics.title',
  },
  'analytics.accounts': {
    path: '/analytics/accounts',
    title: 'analytics.title',
  },
  'analytics.accounts.groupings': {
    path: '/analytics/accounts/groupings',
    title: 'analytics.groupings.title',
  },
  'analytics.accounts.groupings.edit': {
    path: '/analytics/accounts/groupings/edit',
    title: 'analytics.groupings.title',
  },
  'analytics.balance': {
    path: '/analytics/balance',
    title: 'analytics.title',
  },
  'analytics.categories': {
    path: '/analytics/categories',
    title: 'analytics.title',
  },
  categories: {
    path: '/categories',
    title: 'categories.title',
  },
  'categories.create': {
    path: '/categories/create',
    title: 'categories.create_category',
  },
  repeatings: {
    path: '/repeatings',
    title: 'repeatings.title',
  },
  transactions: {
    path: '/transactions',
    title: 'transactions.title',
  },
  'transactions.create': {
    path: '/transactions/create',
    title: 'transactions.new_transaction',
  },
  'transactions.import': {
    path: '/transactions/import',
    title: 'transactions.import.title',
  },
  'transactions.import.rules': {
    path: '/transactions/import/rules',
    title: 'transactions.import.rules.title',
  },
  'transactions.import.rules.create': {
    path: '/transactions/import/rules/create',
    title: 'transactions.import.rules.create',
  },
  settings: {
    path: '/settings',
    title: 'settings.title',
  },
  'settings.language': {
    path: '/settings/language',
    title: 'settings.select_language',
  },
  'settings.currency_rates': {
    path: '/settings/currency-rates',
    title: 'currency_rates.title',
  },
  'settings.encryption': {
    path: '/settings/encryption',
    title: 'settings.encryption',
  },
  'settings.import_export': {
    path: '/settings/import-export',
    title: 'settings.import_export',
  },
  'settings.logs': {
    path: '/settings/logs',
    title: 'settings.logs',
  },
  uikit: {
    path: '/uikit',
    title: 'settings.uikit',
  },
};

export function findRoute(path: string) {
  return Object.values(routes).find((route) => route.path === path);
}

export function route(key: RouteKey) {
  return routes[key].path;
}
