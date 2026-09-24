import { expect, test } from '@tests/fixtures';

import { importMockDataAsync } from '@tests/helpers';
import { mockData } from '@tests/mock';

test('shows the total for transactions with the same comment when a category is opened', async ({ page }) => {
  const data = JSON.parse(mockData) as {
    accounts: Array<{ currency: string }>;
    operations: Array<{
      id: string;
      accountId: string;
      categoryId: string;
      date: string;
      amount: number;
      comment?: string | null;
      tagIds: string[];
    }>;
  };

  data.accounts.forEach((account) => (account.currency = 'USD'));

  const petExpense = data.operations.find((operation) => operation.comment === 'Food for pets');
  expect(petExpense).toBeDefined();

  data.operations = [
    { ...petExpense!, date: '2024-02-01T12:00:00.000Z', amount: 50.5 },
    { ...petExpense!, id: 'pet-expense-2', date: '2024-02-02T12:00:00.000Z', amount: 25 },
    { ...petExpense!, id: 'pet-expense-3', date: '2024-02-03T09:00:00.000Z', amount: 10, comment: null },
  ];

  await importMockDataAsync(page, JSON.stringify(data));
  await page.goto('/analytics/categories', { waitUntil: 'networkidle' });

  await page.getByRole('button', { name: /T_Pets/ }).click();

  const comments = page.getByRole('region', { name: 'By comment' });
  await expect(comments.getByRole('listitem').filter({ hasText: 'Food for pets' })).toContainText(/-75\.50\sUSD/);
  await expect(comments.getByRole('listitem').filter({ hasText: 'No comment' })).toContainText(/-10\sUSD/);
});
