import { page } from '$app/stores';
import type { Messages } from '$lib/translate';
import { derived, readable } from 'svelte/store';
import { routes } from '../../routes';

export type MenuItem = {
  icon: string;
  title: Messages;
  path: string;
};

const _menu = readable<MenuItem[]>([
  {
    icon: 'mdi:shape-outline',
    title: 'categories.title',
    path: routes.categories.path,
  },
  {
    icon: 'mdi:briefcase-outline',
    title: 'accounts.title',
    path: routes.accounts.path,
  },
  {
    icon: 'mdi:cog-outline',
    title: 'settings.title',
    path: routes.settings.path,
  },
]);

export const menu = derived([page, _menu], ([p, m]) =>
  p.url.pathname.startsWith('/v2')
    ? m.map((item) => ({
        ...item,
        path: '/v2' + item.path,
      }))
    : m,
);

export const activeMenuItem = derived([page, menu], ([p, m]) => m.find((x) => x.path == p.url.pathname));
