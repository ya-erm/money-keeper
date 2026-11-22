import { describe, expect, it } from 'vitest';
import { allocationPercentages } from './percentages.js';
const shares = (...amounts: number[]) => ({
  shares: amounts.map((amount, index) => ({ walletId: String(index), amount })),
});

describe('allocation percentages', () => {
  it('shows equal and custom shares in their recorded order', () => {
    expect(allocationPercentages(shares(5000, 5000))).toEqual([50, 50]);
    expect(allocationPercentages(shares(367, 633))).toEqual([37, 63]);
    expect(allocationPercentages(shares(2, 1))).toEqual([67, 33]);
  });
  it('rounds multiple shares to a total of 100', () => {
    expect(allocationPercentages(shares(1, 1, 1))).toEqual([34, 33, 33]);
    expect(allocationPercentages(shares(333, 333, 334))).toEqual([33, 33, 34]);
  });
  it('keeps very small positive shares and ignores zero shares', () => {
    expect(allocationPercentages(shares(0, 0.01, 999.99))).toEqual([0, 100]);
  });
  it('does not label personal, missing or invalid allocations as shared', () => {
    expect(allocationPercentages()).toEqual([]);
    expect(allocationPercentages(shares(0, 100))).toEqual([]);
    expect(allocationPercentages(shares(NaN, Infinity, -1, 100))).toEqual([]);
  });
});
