import { format, getLocaleFromNavigator, init, locale } from 'svelte-i18n';
import { derived, type Readable } from 'svelte/store';

import dayjs from 'dayjs';
import 'dayjs/locale/ru';

import { storable } from '$lib/storable';

import type { Locales, Messages } from './messages';

import './en';
import './ru';

export type { Locales, Messages } from './messages';

const initialLocale = getLocaleFromNavigator();

void init({
  fallbackLocale: 'en-US',
  initialLocale,
});

type FormatOptions = {
  locale?: string;
  format?: string;
  default?: string;
  values?: Record<string, string | number | boolean | Date | null | undefined> | undefined;
};
type MessageFormatter = (id: Messages, options?: FormatOptions) => string;

export const translate = format as Readable<MessageFormatter>;

export const languages: { [key in Locales]: { name: string; icon: string; dayjs: string } } = {
  'ru-RU': { name: 'Русский', icon: 'circle-flags:ru', dayjs: 'ru' },
  'en-US': { name: 'English', icon: 'circle-flags:gb', dayjs: 'en' },
};

export const activeLocale = storable<Locales>((initialLocale as Locales) ?? 'ru-RU', 'locale');
activeLocale.subscribe((value) => {
  void locale.set(value);
  dayjs.locale(languages[value]?.dayjs);
});

export const activeLocaleName = derived(activeLocale, (value) => languages[value]?.name ?? languages['en-US'].name);
