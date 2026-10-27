import type { PurchaseItem } from '#lib/data/interfaces.js';

export type PurchaseItemDraft = {
  name: string;
  quantity: number | undefined;
  unitPrice: number | undefined;
  total: number | undefined;
};

export function calculateItemTotal(quantity: number | undefined, unitPrice: number | undefined) {
  if (quantity === undefined || unitPrice === undefined || !Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
    return undefined;
  }
  return Math.round((quantity * unitPrice + Number.EPSILON) * 100) / 100;
}

export function toPurchaseItems(drafts: PurchaseItemDraft[]): PurchaseItem[] {
  return drafts.map(({ name, quantity, unitPrice, total }) => {
    if (
      !name.trim() ||
      quantity === undefined ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      unitPrice === undefined ||
      !Number.isFinite(unitPrice) ||
      unitPrice < 0 ||
      total === undefined ||
      !Number.isFinite(total) ||
      total < 0
    ) {
      throw new Error('Invalid purchase item');
    }
    return { name: name.trim(), quantity, unitPrice, total };
  });
}
