import { page } from '#lib/page.js';
import type { Messages } from '#lib/translate/messages.js';
import { derived, readable } from 'svelte/store';
import { routes } from '../../routes';
import { memberSettingsStore } from '#lib/data/members.js';

export type MenuItem = {
  icon: string;
  title: Messages;
  path: string;
};

const baseMenu = readable<MenuItem[]>([
  { icon: 'mdi:account-cash-outline', title: 'debts.title', path: routes.debts.path },
  {
    icon: 'mdi:briefcase-outline',
    title: 'accounts.title',
    path: routes.accounts.path,
  },
  {
    icon: 'mdi:analytics',
    title: 'analytics.title',
    path: routes.analytics.path,
  },
  {
    icon: 'mdi:cog-outline',
    title: 'settings.title',
    path: routes.settings.path,
  },
]);

export const menu = derived([baseMenu, memberSettingsStore], ([items, settings]) => {
  const result = [...items];
  if (settings?.walletsEnabled) {
    result.splice(2, 0, { icon: 'mdi:wallet-outline', title: 'wallets.title', path: routes.wallets.path });
  } else {
    result.splice(1, 0, { icon: 'mdi:shape-outline', title: 'categories.title', path: routes.categories.path });
  }
  return result;
});

export const activeMenuItem = derived([page, menu], ([p, m]) => m.find((x) => x.path == p.url.pathname));
