import { load } from 'cheerio';
import { parseSerbianReceipt, type ReceiptDetails, type ReceiptItem } from '#lib/receipts/serbianReceipt.js';

const ORIGIN = 'https://suf.purs.gov.rs';

async function readBounded(response: Response, limit: number): Promise<string> {
  if (!response.ok || !response.body) throw new Error('Receipt service unavailable');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.length;
      if (length > limit) throw new Error('Receipt response too large');
      chunks.push(chunk.value);
    }
  } finally {
    await reader.cancel();
  }
  return Buffer.concat(chunks).toString('utf8');
}

export function parseReceiptPage(html: string, expectedNumber: string, expectedAmount: number) {
  const $ = load(html);
  const text = (selector: string) => $(selector).first().text().replace(/\s+/g, ' ').trim();
  const number = text('#invoiceNumberLabel');
  const amount = Number(text('#totalAmountLabel').replace(/\./g, '').replace(',', '.'));
  if (number !== expectedNumber || !Number.isFinite(amount) || Math.abs(amount - expectedAmount) > 0.005) {
    throw new Error('Receipt page does not match QR');
  }
  // Never evaluate the site's scripts. Extract only its per-page specifications token.
  const token = html.match(/viewModel\.Token\(['"]([a-f0-9-]{36})['"]\)/i)?.[1];
  const details: ReceiptDetails = {
    merchant: '',
    store: text('#shopFullNameLabel'),
    address: text('#addressLabel'),
    city: text('#cityLabel'),
    taxId: text('#tinLabel'),
    journal: $('#collapse3 pre').first().text().trim().slice(0, 100000),
    items: [],
    itemsAvailable: false,
  };
  // The print header has a logo before the company paragraph on some receipts.
  if (!details.merchant) {
    const lines = details.journal
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const taxIdIndex = lines.indexOf(details.taxId);
    details.merchant = taxIdIndex >= 0 ? (lines[taxIdIndex + 1] ?? details.store) : details.store;
  }
  return { details, token };
}

export function parseReceiptItems(data: unknown, expectedAmount: number): ReceiptItem[] {
  if (
    !data ||
    typeof data !== 'object' ||
    !('success' in data) ||
    data.success !== true ||
    !('items' in data) ||
    !Array.isArray(data.items) ||
    data.items.length > 1000
  ) {
    throw new Error('Invalid receipt specifications');
  }
  const items = data.items.map((value: unknown): ReceiptItem => {
    if (!value || typeof value !== 'object') throw new Error('Invalid item');
    const item = value as Record<string, unknown>;
    if (
      typeof item.name !== 'string' ||
      item.name.length > 2048 ||
      !item.name.trim() ||
      typeof item.quantity !== 'number' ||
      !Number.isFinite(item.quantity) ||
      item.quantity <= 0 ||
      typeof item.unitPrice !== 'number' ||
      !Number.isFinite(item.unitPrice) ||
      item.unitPrice < 0 ||
      typeof item.total !== 'number' ||
      !Number.isFinite(item.total) ||
      item.total < 0
    ) {
      throw new Error('Invalid item');
    }
    return { name: item.name.trim(), quantity: item.quantity, unitPrice: item.unitPrice, total: item.total };
  });
  if (!items.length || Math.abs(items.reduce((sum, item) => sum + item.total, 0) - expectedAmount) > 0.01) {
    throw new Error('Receipt item totals do not match QR');
  }
  const grouped = new Map<string, ReceiptItem>();
  for (const item of items) {
    // Group by the original label so distinct article codes never merge after display cleanup.
    const key = JSON.stringify([item.name, item.unitPrice]);
    const existing = grouped.get(key);
    if (existing) {
      existing.quantity = Number((existing.quantity + item.quantity).toFixed(10));
      existing.total = Math.round((existing.total + item.total) * 100) / 100;
    } else {
      // Retailers may append the unit and their numeric article code: name/KOM/7002829.
      const name = item.name.match(/^(.+)\/[\p{L}][\p{L}\d .²³]*\/\d+$/u)?.[1].trim() || item.name;
      grouped.set(key, { ...item, name });
    }
  }
  return [...grouped.values()];
}

export function parseReceiptJournal(journal: string, expectedAmount: number): ReceiptItem[] {
  const lines = journal.split(/\r?\n/).map((line) => line.trim());
  const header = lines.findIndex((line) =>
    /^(?:Назив\s+Цена\s+Кол\.?\s+Укупно|Naziv\s+Cena\s+Kol\.?\s+Ukupno)$/u.test(line),
  );
  if (header < 0) throw new Error('Unsupported receipt journal');
  const end = lines.findIndex((line, index) => index > header && /^-{5,}$/.test(line));
  if (end < 0) throw new Error('Incomplete receipt journal');
  const number = '(\\d+(?:\\.\\d{3})*(?:,\\d+)?)';
  const values = new RegExp(`^${number}\\s+${number}\\s+${number}$`);
  const decimal = (value: string) => Number(value.replace(/\./g, '').replace(',', '.'));
  const items: ReceiptItem[] = [];
  let nameLines: string[] = [];
  for (const line of lines.slice(header + 1, end)) {
    if (!line) continue;
    const match = line.match(values);
    if (!match) {
      nameLines.push(line);
      continue;
    }
    const label = nameLines.join(' ');
    const taxLabel = /\s+\([\p{L}](?:,\s*[\p{L}])*\)$/u;
    if (!taxLabel.test(label)) throw new Error('Invalid journal item label');
    const unitPrice = decimal(match[1]);
    const quantity = decimal(match[2]);
    const total = decimal(match[3]);
    if (Math.abs(Math.round(unitPrice * quantity * 100) / 100 - total) > 0.01) {
      throw new Error('Inconsistent journal item');
    }
    items.push({ name: label.replace(taxLabel, ''), quantity, unitPrice, total });
    nameLines = [];
  }
  if (nameLines.length) throw new Error('Incomplete journal item');
  return parseReceiptItems({ success: true, items }, expectedAmount);
}

export async function loadSerbianReceiptDetails(value: string, request: typeof fetch = fetch): Promise<ReceiptDetails> {
  const receipt = parseSerbianReceipt(value);
  const source = new URL(receipt.url);
  const url = new URL('/v/', ORIGIN);
  url.searchParams.set('vl', source.searchParams.get('vl') ?? '');
  const signal = AbortSignal.timeout(12000);
  const options = { signal, redirect: 'error' as const, headers: { 'Accept-Language': 'sr-Cyrl-RS' } };
  const html = await readBounded(await request(url, options), 1024 * 1024);
  const { details, token } = parseReceiptPage(html, receipt.number, receipt.amount);
  if (token) {
    try {
      const response = await request(`${ORIGIN}/specifications`, {
        ...options,
        method: 'POST',
        headers: { ...options.headers, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ invoiceNumber: receipt.number, token }),
      });
      details.items = parseReceiptItems(JSON.parse(await readBounded(response, 1024 * 1024)), receipt.amount);
      details.itemsAvailable = true;
    } catch {
      // Merchant and the textual journal are still useful when specifications are unavailable.
    }
  }
  if (!details.itemsAvailable) {
    try {
      details.items = parseReceiptJournal(details.journal, receipt.amount);
      details.itemsAvailable = true;
    } catch {
      // Keep the original journal when its item layout cannot be parsed reliably.
    }
  }
  return details;
}
