import { describe, expect, it } from 'vitest';
import { calculateItemTotal, toPurchaseItems } from './purchaseItems';

describe('purchase items', () => {
  it('keeps each item as separate numeric fields', () => {
    expect(toPurchaseItems([{ name: ' Cheese ', quantity: 0.5, unitPrice: 200, total: 100 }])).toEqual([
      { name: 'Cheese', quantity: 0.5, unitPrice: 200, total: 100 },
    ]);
  });
  it('calculates rounded totals for fractional quantities', () => {
    expect(calculateItemTotal(0.375, 199.99)).toBe(75);
    expect(calculateItemTotal(2, 56.24)).toBe(112.48);
  });
  it('does not turn missing prices into zero', () => {
    expect(calculateItemTotal(1, undefined)).toBeUndefined();
    expect(() => toPurchaseItems([{ name: 'Cheese', quantity: 1, unitPrice: undefined, total: undefined }])).toThrow();
  });
  it('accepts a free item with a known zero price', () => {
    expect(toPurchaseItems([{ name: 'Gift', quantity: 1, unitPrice: 0, total: 0 }])[0].unitPrice).toBe(0);
  });
  it('rejects empty names and invalid quantities', () => {
    expect(() => toPurchaseItems([{ name: '', quantity: 1, unitPrice: 1, total: 1 }])).toThrow();
    expect(() => toPurchaseItems([{ name: 'Item', quantity: 0, unitPrice: 1, total: 1 }])).toThrow();
  });
});
