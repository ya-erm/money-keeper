import { page } from '$app/stores';
import type { Messages } from '$lib/translate';
import { derived, readable } from 'svelte/store';
import { routes } from '../../routes';

export type MenuItem = {
  icon: string;
  title: Messages;
  path: string;
};

export const menu = readable<MenuItem[]>([
  {
    icon: 'mdi:account',
    title: 'auth.profile',
    path: routes.login.path,
  },
  {
    icon: 'mdi:account-group',
    title: 'groups.title',
    path: routes.groups.path,
  },
  {
    icon: 'mdi:briefcase-outline',
    title: 'accounts.title',
    path: routes.accounts.path,
  },
  {
    icon: 'mdi:shape-outline',
    title: 'categories.title',
    path: routes.categories.path,
  },
  {
    icon: 'mdi:cog-outline',
    title: 'settings.title',
    path: '/uikit',
  },
]);

export const activeMenuItem = derived([page, menu], ([p, m]) => m.find((x) => x.path == p.url.pathname));
