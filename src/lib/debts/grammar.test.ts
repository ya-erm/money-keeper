import { describe, expect, it } from 'vitest';
import type { ContactGrammaticalForm } from '../data/interfaces';
import { debtEn, debtRu } from '../translate/debtMessages';
import { debtDirectionMessage, repaymentDirectionMessage } from './grammar';

describe('contact grammatical agreement', () => {
  it.each<[ContactGrammaticalForm, string]>([
    ['masculine', 'Должен мне'],
    ['feminine', 'Должна мне'],
    ['neuter', 'Должно мне'],
    ['plural', 'Должны мне'],
  ])('agrees with %s in Russian and keeps an English neutral label', (grammaticalForm, label) => {
    const message = debtDirectionMessage({ grammaticalForm }, 10);
    expect(debtRu[message]).toBe(label);
    expect(debtEn[message]).toBe('Owed to me');
    expect(debtDirectionMessage({ grammaticalForm }, -10)).toBe('debts.payable');
  });
  it('preserves the generic wording for legacy or unspecified contacts', () => {
    expect(debtDirectionMessage({}, 10)).toBe('debts.receivable');
    expect(debtDirectionMessage(undefined, 10)).toBe('debts.receivable');
  });
  it.each<[ContactGrammaticalForm, string]>([
    ['masculine', 'Он вернул'],
    ['feminine', 'Она вернула'],
    ['neuter', 'Оно вернуло'],
    ['plural', 'Они вернули'],
  ])('agrees with %s when recording a received repayment', (grammaticalForm, label) => {
    const message = repaymentDirectionMessage({ grammaticalForm });
    expect(debtRu[message]).toBe(label);
    expect(debtEn[message]).toBe('They repaid me');
  });
  it('uses the plural repayment label when agreement has not been set', () => {
    expect(repaymentDirectionMessage(null)).toBe('debts.they_returned');
    expect(repaymentDirectionMessage({})).toBe('debts.they_returned');
  });
});
