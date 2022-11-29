import type { Page } from '@sveltejs/kit';

export function getNumberSearchParam(page: Page, name: string) {
  return parseInt(page.url.searchParams.get(name) ?? '') || null;
}

export function getSearchParam(page: Page, name: string) {
  return page.url.searchParams.get(name);
}
