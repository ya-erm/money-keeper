import { describe, expect, it } from 'vitest';
import { normalizeReceiptAmount, parseReceiptText, validReceiptDateTime } from './receiptText';

describe('receipt text recognition', () => {
  it('extracts the manual verification fields without confusing the tax or payment with the total', () => {
    expect(
      parseReceiptText(`Цена Кол. Укупно
      390,00 1 390,00
      Укупан износ: 580,00
      Платна картица: 580,00
      Укупан износ пореза: 96,67
      ПФР време: 21.10.2026. 21:19:12
      ПФР број рачуна: 625HUY57-625HUY57-55646
      Бројач рачуна: 55237/55646ПП`),
    ).toEqual({
      invoiceNumber: '625HUY57-625HUY57-55646',
      counter: '55237/55646',
      extension: 'ПП',
      amount: '580.00',
      dateTime: '21.10.2026. 21:19:12',
    });
  });
  it('allows different device IDs, Latin labels and spaces around separators', () => {
    expect(
      parseReceiptText(`PFR broj: ABCD1234 – EFGH5678 - 12
      Brojac: 10 / 12 PR
      Ukupan iznos: 1.234,70
      1.2.2026. 9:05`),
    ).toEqual({
      invoiceNumber: 'ABCD1234-EFGH5678-12',
      counter: '10/12',
      extension: 'ПР',
      amount: '1234.70',
      dateTime: '01.02.2026. 09:05',
    });
  });
  it('does not guess missing fields or silently replace ambiguous ID characters', () => {
    expect(parseReceiptText('ПФР број: 625H0Y57-625HUY57-55646').invoiceNumber).toBe('625H0Y57-625HUY57-55646');
    expect(parseReceiptText('')).toEqual({ invoiceNumber: '', counter: '', extension: '', amount: '', dateTime: '' });
    expect(parseReceiptText('625HUY57-625HUY57-55646\n55237/5564607Л\n21.10.2026 21:1970').counter).toBe(
      '55237/5564607Л',
    );
    expect(parseReceiptText('21.10.2026 21:1970').dateTime).toBe('21.10.2026. 21:1970');
  });
  it('preserves the first candidate and contradictory counters for correction', () => {
    const text = 'ABCD1234-EFGH5678-12\nABCD1234-EFGH5678-13\nУкупан износ: 10,00\nУкупан износ: 20,00';
    expect(parseReceiptText(text).invoiceNumber).toBe('ABCD1234-EFGH5678-12');
    expect(parseReceiptText(text).amount).toBe('10.00');
    expect(parseReceiptText('ABCD1234-EFGH5678-12\n10/13ПП').counter).toBe('10/13');
  });
  it('keeps malformed OCR as editable values instead of requiring re-entry', () => {
    expect(
      parseReceiptText(`ПФР број рачуна: 625H?Y57-625HUY5?-5564G
      Бројач рачуна: 55237/55б46ПП
      Укупан износ: 58O,OO
      ПФР време: 21.10.2026. 21:1970`),
    ).toEqual({
      invoiceNumber: '625H?Y57-625HUY5?-5564G',
      counter: '55237/55б46',
      extension: 'ПП',
      amount: '58O,OO',
      dateTime: '21.10.2026. 21:1970',
    });
  });
  it('preserves a labeled PFR value even with missing separators or spaces inside IDs', () => {
    expect(parseReceiptText('ПФР број рачуна: 625HU Y57 625HUY57-5564G').invoiceNumber).toBe('625HUY57625HUY57-5564G');
    expect(parseReceiptText('ПФЕ У рачуна: 625HU Y57-625HUY57-55646').invoiceNumber).toBe('625HUY57-625HUY57-55646');
  });
  it.each([
    ['1,234.70', '1234.70'],
    ['580,00', '580.00'],
    ['1 234,70', '1234.70'],
    ['12.34.70', ''],
    ['580', ''],
  ])('normalizes %s', (input, expected) => {
    expect(normalizeReceiptAmount(input)).toBe(expected);
  });
  it.each(['31.02.2026. 12:00', '21.10.2026 24:00', '21.10.2026 21:19:70'])('rejects invalid dates %s', (value) => {
    expect(validReceiptDateTime(value)).toBe(false);
  });
});
