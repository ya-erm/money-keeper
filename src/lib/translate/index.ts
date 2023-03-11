import { storable } from '$lib/storable';
import { format, getLocaleFromNavigator, init, locale } from 'svelte-i18n';
import { derived, type Readable } from 'svelte/store';
import type { Locales, Messages } from './messages';
import './en';
import './ru';

export type { Locales, Messages } from './messages';

const initialLocale = getLocaleFromNavigator();

init({
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

export const languages: { [key in Locales]: { name: string; icon: string } } = {
  'ru-RU': { name: 'Русский', icon: 'circle-flags:ru' },
  'en-US': { name: 'English', icon: 'circle-flags:gb' },
};

export const activeLocale = storable<Locales>((initialLocale as Locales) ?? 'ru-RU', 'locale');
activeLocale.subscribe((value) => locale.set(value));

export const activeLocaleName = derived(activeLocale, (value) => languages[value]?.name ?? languages['en-US'].name);
