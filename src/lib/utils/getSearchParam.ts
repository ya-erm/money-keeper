import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import type { Page } from '@sveltejs/kit';

export function getNumberSearchParam(page: Page, name: string) {
  return Number.parseInt(page.url.searchParams.get(name) ?? '') || null;
}

export function getSearchParam(page: Page, name: string) {
  return page.url.searchParams.get(name);
}

function getPathWithSearchParams(page: Page, searchParams: URLSearchParams) {
  const query = searchParams.toString();
  return query ? `${page.url.pathname}?${query}` : page.url.pathname;
}

/** Path of the current page with some search params changed (`null` removes a param) */
export function withSearchParams(page: Page, params: Record<string, string | null>) {
  const searchParams = new URLSearchParams(page.url.searchParams);
  for (const [name, value] of Object.entries(params)) {
    if (value === null) searchParams.delete(name);
    else searchParams.set(name, value);
  }
  return getPathWithSearchParams(page, searchParams);
}

export async function setSearchParam(
  page: Page,
  name: string,
  value: string,
  { replace }: { replace: boolean } = { replace: true },
) {
  const searchParams = new URLSearchParams(page.url.searchParams);
  searchParams.set(name, value);
  await goto(resolve(getPathWithSearchParams(page, searchParams), {}), { replaceState: replace });
}

export async function deleteSearchParam(page: Page, name: string | string[]) {
  const searchParams = new URLSearchParams(page.url.searchParams);
  for (const item of Array.isArray(name) ? name : [name]) {
    searchParams.delete(item);
  }
  await goto(resolve(getPathWithSearchParams(page, searchParams), {}), { replaceState: true });
}
