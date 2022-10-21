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
