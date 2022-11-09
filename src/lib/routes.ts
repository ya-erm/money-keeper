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
  | 'categories'
  | 'categories.create'
  | 'transactions'
  | 'transactions.create'
  | 'transactions.import'
  | 'settings'
  | 'settings.language';

export const routes: { [key in RouteKey]: Route } = {
  root: {
    path: '/',
    title: 'settings.title',
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
    title: 'auth.register',
  },
  profile: {
    path: '/profile',
    title: 'auth.profile',
  },
  groups: {
    path: '/groups',
    title: 'groups.title',
  },
  'groups.create': {
    path: '/groups/create',
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
  categories: {
    path: '/categories',
    title: 'categories.title',
  },
  'categories.create': {
    path: '/categories/create',
    title: 'categories.create_category',
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
  settings: {
    path: '/settings',
    title: 'settings.title',
  },
  'settings.language': {
    path: '/settings/language',
    title: 'settings.select_language',
  },
};

export function findRoute(path: string) {
  return Object.values(routes).find((route) => route.path == path);
}
