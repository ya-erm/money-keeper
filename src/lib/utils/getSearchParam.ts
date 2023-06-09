import { goto } from '$app/navigation';
import type { Page } from '@sveltejs/kit';

export function getNumberSearchParam(page: Page, name: string) {
  return parseInt(page.url.searchParams.get(name) ?? '') || null;
}

export function getSearchParam(page: Page, name: string) {
  return page.url.searchParams.get(name);
}

export async function setSearchParam(page: Page, name: string, value: string) {
  page.url.searchParams.set(name, value);
  await goto(page.url, { replaceState: true });
}

export async function deleteSearchParam(page: Page, name: string) {
  page.url.searchParams.delete(name);
  await goto(page.url, { replaceState: true });
}
