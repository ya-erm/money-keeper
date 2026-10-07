import { building } from '$app/environment';

import { activeLocale } from '$lib/translate';
import { getLocaleFromAcceptLanguageHeader, initI18N, initialLocale } from '$lib/translate/init';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, request }) => {
  // The prerendered PWA entry is public and must not depend on request cookies.
  if (building) {
    initI18N('en-US');
    activeLocale.set(initialLocale);
    return;
  }

  const localeFromCookie = cookies.get('locale');

  const acceptLanguagesHeader = request.headers.get('accept-language');
  const localeFromHeader = getLocaleFromAcceptLanguageHeader(acceptLanguagesHeader);

  initI18N(localeFromCookie, localeFromHeader);

  activeLocale.set(initialLocale);
};
