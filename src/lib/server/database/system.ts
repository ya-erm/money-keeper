import type { Prisma } from '@prisma/client';

export const SYSTEM_CATEGORY_TRANSFER_OUT: Prisma.CategoryCreateInput = {
  type: 'OUT',
  name: 'system.category.transfer_out',
  icon: 'mdi:swap-horizontal',
};

export const SYSTEM_CATEGORY_TRANSFER_IN: Prisma.CategoryCreateInput = {
  type: 'IN',
  name: 'system.category.transfer_in',
  icon: 'mdi:swap-horizontal',
};
