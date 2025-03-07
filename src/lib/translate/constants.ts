import type { Locales } from './types';

export const languages: Record<Locales, { name: string; icon: string; dayjs: string }> = {
  'ru-RU': { name: 'Русский', icon: 'circle-flags:ru', dayjs: 'ru' },
  'en-US': { name: 'English', icon: 'circle-flags:gb', dayjs: 'en' },
};
