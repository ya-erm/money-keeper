import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { loadSerbianReceiptDetails, parseReceiptItems, parseReceiptJournal, parseReceiptPage } from './serbianReceipt';

const sample = readFileSync(new URL('../../receipts/fixtures/serbian-receipt.txt', import.meta.url), 'utf8').trim();
const html = `<span id="invoiceNumberLabel">FTH7EX9W-FTH7EX9W-19890</span>
<span id="totalAmountLabel">525,70</span><span id="tinLabel">106884584</span>
<span id="shopFullNameLabel">1057443-Prodavnica br. 0153</span>
<span id="addressLabel">&#x422;РОГИРСКА ПАДИНА 2</span><span id="cityLabel">БЕОГРАД</span>
<div id="collapse3"><pre>============ ФИСКАЛНИ РАЧУН ============
106884584
LIDL SRBIJA KD
Item: 525,70
<img src="https://example.com/not-loaded.png">
</pre></div><script>viewModel.Token('00000000-0000-0000-0000-000000000000');</script>`;
const specs = { success: true, items: [{ name: 'Item', quantity: 2, unitPrice: 262.85, total: 525.7 }] };
const journal = `Артикли
========================================
Назив   Цена         Кол.         Укупно
Dimlj. zač. sir/KOM/7002829 (Ђ)
       199,99          1          199,99
Čajna kobasica/KOM/0227727 (Ђ)
       156,99          1          156,99
Kinder mlečni dezert/KOM/7128717 (Ђ)
        56,24          1           56,24
Kinder mlečni dezert/KOM/7128717 (Ђ)
        56,24          1           56,24
Kinder mlečni dezert/KOM/7128717 (Ђ)
        56,24          1           56,24
----------------------------------------
Укупан износ:                     525,70`;

describe('Serbian receipt details', () => {
  it('decodes entities and extracts the company, address and journal without HTML', () => {
    const { details } = parseReceiptPage(html, 'FTH7EX9W-FTH7EX9W-19890', 525.7);
    expect(details.merchant).toBe('LIDL SRBIJA KD');
    expect(details.address).toBe('ТРОГИРСКА ПАДИНА 2');
    expect(details.journal).toContain('Item: 525,70');
    expect(details.journal).not.toContain('<img');
  });

  it('rejects a page for another receipt or a mismatched amount', () => {
    expect(() => parseReceiptPage(html, 'OTHER', 525.7)).toThrow();
    expect(() => parseReceiptPage(html, 'FTH7EX9W-FTH7EX9W-19890', 100)).toThrow();
  });

  it('loads specifications using the fresh page token and a fixed host', async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(html))
      .mockResolvedValueOnce(Response.json(specs));
    const result = await loadSerbianReceiptDetails(`${sample}&ignored=1`, request);
    expect(result.merchant).toBe('LIDL SRBIJA KD');
    expect(result.itemsAvailable).toBe(true);
    expect(result.items).toEqual(specs.items);
    expect(new URL(String(request.mock.calls[0][0])).searchParams.has('ignored')).toBe(false);
    expect(request.mock.calls[0][1]?.redirect).toBe('error');
    expect(request.mock.calls[1][0]).toBe('https://suf.purs.gov.rs/specifications');
    expect(String(request.mock.calls[1][1]?.body)).toContain('invoiceNumber=FTH7EX9W-FTH7EX9W-19890');
  });

  it('keeps the journal and merchant when specifications fail', async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(html))
      .mockResolvedValueOnce(new Response('', { status: 503 }));
    const result = await loadSerbianReceiptDetails(sample, request);
    expect(result.merchant).toBe('LIDL SRBIJA KD');
    expect(result.itemsAvailable).toBe(false);
    expect(result.journal).toContain('525,70');
  });

  it.each([true, false])(
    'reads structured items from the journal when specifications fail (token: %s)',
    async (hasToken) => {
      const page = html.replace('Item: 525,70', journal);
      const source = hasToken ? page : page.replace('viewModel.Token', 'missingToken');
      const request = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(new Response(source))
        .mockResolvedValueOnce(new Response('', { status: 503 }));
      const result = await loadSerbianReceiptDetails(sample, request);
      expect(result.itemsAvailable).toBe(true);
      expect(result.items).toEqual([
        { name: 'Dimlj. zač. sir', quantity: 1, unitPrice: 199.99, total: 199.99 },
        { name: 'Čajna kobasica', quantity: 1, unitPrice: 156.99, total: 156.99 },
        { name: 'Kinder mlečni dezert', quantity: 3, unitPrice: 56.24, total: 168.72 },
      ]);
      expect(request).toHaveBeenCalledTimes(hasToken ? 2 : 1);
    },
  );

  it('reads wrapped names, fractional quantities and thousands separators from the journal', () => {
    const source = `Naziv Cena Kol. Ukupno
Long product
name/KG/001 (A, B)
1.200,00 0,375 450,00
----------------------------------------`;
    expect(parseReceiptJournal(source, 450)).toEqual([
      { name: 'Long product name', quantity: 0.375, unitPrice: 1200, total: 450 },
    ]);
  });

  it.each([
    journal.replace('199,99', '100,00'),
    journal.replace('199,99          1          199,99', '199,99          1          190,00'),
    journal.replace('Kinder mlečni dezert/KOM/7128717 (Ђ)\n        56,24          1           56,24', ''),
    journal.replace('----------------------------------------', 'Unparsed product (Ђ)'),
  ])('rejects incomplete or inconsistent journal items', (source) => {
    expect(() => parseReceiptJournal(source, 525.7)).toThrow();
  });

  it('cleans retailer suffixes and combines repeated items without changing receipt totals', () => {
    const items = [
      { name: 'Dimlj. zač. sir/KOM/7002829', quantity: 1, unitPrice: 199.99, total: 199.99 },
      { name: 'Čajna kobasica/KOM/0227727', quantity: 1, unitPrice: 156.99, total: 156.99 },
      ...Array.from({ length: 3 }, () => ({
        name: 'Kinder mlečni dezert/KOM/7128717',
        quantity: 1,
        unitPrice: 56.24,
        total: 56.24,
      })),
    ];
    expect(parseReceiptItems({ success: true, items }, 525.7)).toEqual([
      { name: 'Dimlj. zač. sir', quantity: 1, unitPrice: 199.99, total: 199.99 },
      { name: 'Čajna kobasica', quantity: 1, unitPrice: 156.99, total: 156.99 },
      { name: 'Kinder mlečni dezert', quantity: 3, unitPrice: 56.24, total: 168.72 },
    ]);
  });

  it('keeps different article codes and prices separate even when cleaned names match', () => {
    const items = [
      { name: 'Cheese/KOM/001', quantity: 1, unitPrice: 10, total: 10 },
      { name: 'Cheese/KOM/002', quantity: 1, unitPrice: 10, total: 10 },
      { name: 'Cheese/KOM/001', quantity: 1, unitPrice: 9, total: 9 },
    ];
    expect(parseReceiptItems({ success: true, items }, 29)).toEqual(items.map((item) => ({ ...item, name: 'Cheese' })));
  });

  it('combines fractional quantities and preserves names without a full retailer suffix', () => {
    const items = [
      { name: 'Apples/KG/123', quantity: 0.1, unitPrice: 100, total: 10 },
      { name: 'Apples/KG/123', quantity: 0.2, unitPrice: 100, total: 20 },
      { name: 'Juice/Orange', quantity: 1, unitPrice: 50, total: 50 },
      { name: 'Model/123', quantity: 1, unitPrice: 20, total: 20 },
    ];
    expect(parseReceiptItems({ success: true, items }, 100)).toEqual([
      { name: 'Apples', quantity: 0.3, unitPrice: 100, total: 30 },
      items[2],
      items[3],
    ]);
  });

  it('rejects oversized remote responses', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response('x'.repeat(1024 * 1024 + 1)));
    await expect(loadSerbianReceiptDetails(sample, request)).rejects.toThrow('too large');
  });

  it('never fetches an arbitrary URL', async () => {
    const request = vi.fn<typeof fetch>();
    await expect(loadSerbianReceiptDetails('http://127.0.0.1/private', request)).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });

  it.each([
    {},
    { success: false, items: [] },
    { success: true, items: [{ name: 'Wrong total', quantity: 1, unitPrice: 10, total: 10 }] },
    { success: true, items: [{ name: 'Invalid', quantity: -1, unitPrice: 525.7, total: 525.7 }] },
  ])('rejects malformed or inconsistent item data', (data) => {
    expect(() => parseReceiptItems(data, 525.7)).toThrow();
  });
});
