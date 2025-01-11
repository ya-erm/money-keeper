import { browser } from '$app/environment';

export function getCookie(name: string) {
  if (!browser) {
    return;
  }

  const matches = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'),
  );
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

type Options = {
  'max-age'?: number;
  expires?: Date | string;
  domain?: string;
  path?: string;
  'http-only'?: boolean;
  secure?: boolean;
};

export function setCookie(name: string, value: string, options: Options = {}) {
  if (!browser) {
    return;
  }

  if (options.expires instanceof Date) {
    options.expires = options.expires.toUTCString();
  }

  let updatedCookie = encodeURIComponent(name) + '=' + encodeURIComponent(value);

  for (const key in options) {
    updatedCookie += '; ' + key;
    // @ts-ignore
    const value = options[key];
    if (value !== true) {
      updatedCookie += '=' + value;
    }
  }

  document.cookie = updatedCookie;
}

export function deleteCookie(name: string) {
  setCookie(name, '', {
    'max-age': -1,
  });
}
