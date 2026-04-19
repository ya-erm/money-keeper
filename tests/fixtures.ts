import { expect, test as base } from '@playwright/test';

const FIXED_NOW_ISO = '2024-02-03T10:15:00.000Z';

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.clock.setSystemTime(FIXED_NOW_ISO);

    await use(page);
  },
});

export { expect };
