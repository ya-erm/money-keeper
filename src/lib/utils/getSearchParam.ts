import { goto } from '$app/navigation';
import type { Page } from '@sveltejs/kit';

export function getNumberSearchParam(page: Page, name: string) {
  return Number.parseInt(page.url.searchParams.get(name) ?? '') || null;
}

export function getSearchParam(page: Page, name: string) {
  return page.url.searchParams.get(name);
}

export async function setSearchParam(
  page: Page,
  name: string,
  value: string,
  { replace }: { replace: boolean } = { replace: true },
) {
  const searchParams = new URLSearchParams(page.url.searchParams);
  searchParams.set(name, value);
  await goto(`?${searchParams.toString()}`, { replaceState: replace });
}

export async function deleteSearchParam(page: Page, name: string) {
  const searchParams = new URLSearchParams(page.url.searchParams);
  searchParams.delete(name);
  await goto(`?${searchParams.toString()}`, { replaceState: true });
}
