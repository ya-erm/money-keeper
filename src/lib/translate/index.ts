import dayjs from 'dayjs';
import { format, locale } from 'svelte-i18n';
import { derived, writable, type Readable } from 'svelte/store';

import { getCookie } from '$lib/utils/cookie';

import { languages } from './constants';
import { initI18N, initialized, initialLocale } from './init';
import type { Locales, MessageFormatter } from './types';

if (!initialized) {
  initI18N(getCookie('locale'));
}

export const activeLocale = writable<Locales | null>(initialLocale);

activeLocale.subscribe((value) => {
  void locale.set(value);
  dayjs.locale(value ? languages[value]?.dayjs : undefined);
});

export const activeLocaleName = derived(activeLocale, (value) => {
  return value ? languages[value].name : null;
});

export const translate = format as Readable<MessageFormatter>;
