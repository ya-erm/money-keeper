import { page } from '$app/stores';
import type { Messages } from '$lib/translate';
import { derived, readable } from 'svelte/store';
import { routes } from './routes';

export type MenuItem = {
  icon: string;
  title: Messages;
  path: string;
};

export const menu = readable<MenuItem[]>([
  {
    icon: '/icons/account.svg',
    title: 'auth.login',
    path: routes.login.path,
  },
  {
    icon: '/icons/briefcase-outline.svg',
    title: 'accounts.title',
    path: routes.accounts.path,
  },
  {
    icon: '/icons/account-group.svg',
    title: 'groups.title',
    path: routes.groups.path,
  },
  {
    icon: '/icons/cog-outline.svg',
    title: 'settings.title',
    path: '/uikit',
  },
]);

export const activeMenuItem = derived([page, menu], ([p, m]) => m.find((x) => x.path == p.url.pathname));
