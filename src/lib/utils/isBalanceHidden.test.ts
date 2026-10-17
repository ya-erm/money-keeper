import { describe, expect, it } from 'vitest';

import { hasHiddenBalanceAccount, isBalanceHidden } from './isBalanceHidden';

describe('account balance visibility', () => {
  const visible = { id: 'visible', hideBalance: false };
  const hidden = { id: 'hidden', hideBalance: true };

  it('uses saved visibility until a local choice is made for that account', () => {
    expect(isBalanceHidden(null, visible)).toBe(false);
    expect(isBalanceHidden(null, hidden)).toBe(true);
    expect(isBalanceHidden(null, visible, { visible: true })).toBe(true);
    expect(isBalanceHidden(null, hidden, { hidden: false })).toBe(false);
    expect(isBalanceHidden(null, visible, { other: true })).toBe(false);
    expect(hidden.hideBalance).toBe(true);
  });

  it('keeps the global hide-amounts preference above account-level choices', () => {
    const settings = { id: 'global' as const, hideBalances: true };
    expect(isBalanceHidden(settings, hidden, { hidden: false })).toBe(true);
    expect(hasHiddenBalanceAccount(settings, [visible], { visible: false })).toBe(true);
    expect(hasHiddenBalanceAccount(settings, [])).toBe(true);
  });

  it('hides an aggregate whenever one contributing account is locally hidden', () => {
    expect(hasHiddenBalanceAccount(null, [visible], { visible: true })).toBe(true);
    expect(hasHiddenBalanceAccount(null, [visible, hidden], { hidden: false })).toBe(false);
    expect(hasHiddenBalanceAccount(null, [visible], { other: true })).toBe(false);
    expect(hasHiddenBalanceAccount(null, [], { visible: true })).toBe(false);
  });
});
