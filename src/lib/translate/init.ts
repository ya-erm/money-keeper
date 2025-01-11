import { getLocaleFromNavigator, init } from 'svelte-i18n';

import 'dayjs/locale/ru';

import './en';
import './ru';

import { getCookie } from '$lib/utils/cookie';
import { Logger } from '$lib/utils/logger';

import { languages } from './constants';
import type { Locales } from './types';

export let initialized = false;

export let initialLocale: Locales | null = findLocale(getCookie('locale')) || null;

const logger = new Logger('translations');

export function initI18N(
  localeFromCookie?: string,
  localeFromHeader?: string,
  localeFromNavigator = getLocaleFromNavigator(),
) {
  initialLocale = findLocale(localeFromCookie ?? localeFromHeader ?? localeFromNavigator);

  logger.debug('init', { localeFromCookie, localeFromHeader, localeFromNavigator }, '=>', initialLocale);

  void init({
    fallbackLocale: 'en-US',
    initialLocale: initialLocale,
  });

  initialized = true;
}

export function findLocale(locale?: string | null) {
  if (!locale) {
    return null;
  }

  if (Object.keys(languages).includes(locale)) {
    return locale as Locales;
  }

  const res = Object.entries(languages).find(([, language]) => language.dayjs === locale);

  if (res?.[0]) {
    return res[0] as Locales;
  }

  return null;
}

export function getLocaleFromAcceptLanguageHeader(header?: string | null) {
  if (!header) {
    return undefined;
  }

  const languages = header.split(',').map((lang) => {
    const [language] = lang.split(';');
    return language.trim();
  });

  logger.debug('accept-language', languages);

  return languages[0];
}
