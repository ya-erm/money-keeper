import { writable } from 'svelte/store';

import { useDB } from './useDB';
import type { Category } from './interfaces';
import type { JournalItem } from './journal';

export const categories = writable<Category[]>([]);

export async function loadCategories() {
  const db = await useDB();
  const items = await db.getAll('categories');
  categories.set(items.filter((x) => !x.deleted));
}

export async function saveCategory(item: Category) {
  const db = await useDB();
  await db.put('categories', item);
  categories.update((prev) => prev.concat(item));
  // TODO: send to server
}

export async function deleteCategory(item: Category) {
  const db = await useDB();
  await db.put('categories', { ...item, deleted: true });
  categories.update((prev) => prev.filter((x) => x.id !== item.id));
  // TODO: send to server
}

export async function processUpdates(updates: JournalItem[]) {
  const dictionary: { [key in string]: Category } = {};
  updates.forEach((update) => {
    const item = update.data.category;
    if (!item) return;
    dictionary[item.id] = item;
  });

  const db = await useDB();
  Promise.all(Object.values(dictionary).map((item) => db.put('categories', item)));
}
