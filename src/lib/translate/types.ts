import type { Messages } from './messages';

export type { Messages } from './messages';

export type Dictionary = { [key in Messages]: string };

export type Locales = 'ru-RU' | 'en-US';

type FormatOptions = {
  locale?: string;
  format?: string;
  default?: string;
  values?: Record<string, string | number | boolean | Date | null | undefined> | undefined;
};

export type MessageFormatter = (id: Messages, options?: FormatOptions) => string;
