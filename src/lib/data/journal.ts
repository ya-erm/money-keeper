import type { Category as CategoryDto } from '@prisma/client';
import { writable } from 'svelte/store';
import type { Category, CategoryType } from './interfaces';

export const syncNum = writable(0);

export type JournalItem = {
  num: number;
  data: JournalOperation;
};

export type JournalOperation = {
  category?: Category;
};

async function fetchJournal() {
  const response = await fetch('/api/categories');
  const json = (await response.json()) as CategoryDto[];
  const items: JournalItem[] = json.map((item, i) => ({
    num: i,
    data: {
      category: {
        ...item,
        id: `${item.id}`,
        type: item.type as CategoryType,
      },
    },
  }));
  return items;
}

export async function initJournal() {
  // 1. Load journal from local DB
  // TODO
  // 2. Fetch updates from server
  const items = await fetchJournal();
  // 3. Save updates
  // TODO
  // 4. Return diff
  return items;
}
