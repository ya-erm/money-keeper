import { loadCategories, processUpdates } from './categories';
import { initJournal } from './journal';

export async function loadAll() {
  // Load from local DB
  await Promise.all([loadCategories()]);

  // Fetch journal updates
  const updates = await initJournal();

  await processUpdates(updates);
}
