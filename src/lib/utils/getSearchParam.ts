import type { Page } from '$app/state';
import { goto } from '$app/navigation';

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
  const searchParams = new URLSearchParams(page.url.search);
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
  const searchParams = new URLSearchParams(page.url.search);
  searchParams.set(name, value);
  // The current pathname already includes the configured base path.
  // eslint-disable-next-line svelte/no-navigation-without-resolve
  await goto(getPathWithSearchParams(page, searchParams), { replace });
}

export async function deleteSearchParam(page: Page, name: string | string[]) {
  const searchParams = new URLSearchParams(page.url.search);
  for (const item of Array.isArray(name) ? name : [name]) {
    searchParams.delete(item);
  }
  // The current pathname already includes the configured base path.
  // eslint-disable-next-line svelte/no-navigation-without-resolve
  await goto(getPathWithSearchParams(page, searchParams), { replace: true });
}
