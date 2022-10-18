import { storable } from '$lib/store/storable';
import { format, getLocaleFromNavigator, init, locale } from 'svelte-i18n';
import { derived, type Readable } from 'svelte/store';
import type { Locales, Messages } from './messages';
import './en';
import './ru';

export type { Locales, Messages } from './messages';

init({
  fallbackLocale: 'en-US',
  initialLocale: getLocaleFromNavigator()
});

type FormatOptions = {
  locale?: string;
  format?: string;
  default?: string;
  values?: Record<string, string | number | boolean | Date | null | undefined> | undefined;
};
type MessageFormatter = (id: Messages, options?: FormatOptions) => string;

export const translate = format as Readable<MessageFormatter>;

export const languages: { [key in Locales]: string } = {
  'ru-RU': 'Русский',
  'en-US': 'English'
};

export const activeLocale = storable<Locales>('ru-RU', 'locale');
activeLocale.subscribe((value) => locale.set(value));

export const activeLocaleName = derived(activeLocale, (value) => languages[value]);
