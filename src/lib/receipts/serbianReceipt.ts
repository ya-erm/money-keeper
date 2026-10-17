import type { PurchaseItem } from '$lib/data/interfaces';

export interface SerbianReceipt {
  amount: number;
  currency: 'RSD';
  date: string;
  number: string;
  type: 'OUT' | 'IN';
  url: string;
  details?: ReceiptDetails;
}

export type ReceiptItem = PurchaseItem;

export interface ReceiptDetails {
  merchant: string;
  store: string;
  address: string;
  city: string;
  taxId: string;
  journal: string;
  items: ReceiptItem[];
  itemsAvailable: boolean;
}

export class ReceiptError extends Error {
  constructor(public reason: 'unsupported' | 'invalid' | 'invoice_type') {
    super(reason);
  }
}

/**
 * TaxCore v3 verification URL format:
 * https://tap.suf.purs.gov.rs/Help/Home/ExportToPdf?file=Create-Verification-URL&hash=1055198429
 * Only decodes the public fields; it does not verify the fiscal signature.
 */
export function parseSerbianReceipt(value: string): SerbianReceipt {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new ReceiptError('unsupported');
  }
  if (url.origin !== 'https://suf.purs.gov.rs' || url.username || url.password || !/^\/v\/?$/.test(url.pathname)) {
    throw new ReceiptError('unsupported');
  }

  const encoded = url.searchParams.get('vl');
  if (!encoded || encoded.length > 1200 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
    throw new ReceiptError('invalid');
  }
  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
  } catch {
    throw new ReceiptError('invalid');
  }
  if (bytes.length < 44 || bytes[0] !== 3 || bytes[43] > 20) throw new ReceiptError('invalid');

  // Encrypted internal data (256/512), signature (256), optional MD5 (16).
  const tailLength = bytes.length - 44 - bytes[43];
  if (![512, 528, 768, 784].includes(tailLength)) throw new ReceiptError('invalid');
  const requestedBy = String.fromCharCode(...bytes.slice(1, 9));
  const signedBy = String.fromCharCode(...bytes.slice(9, 17));
  if (!/^[A-Z0-9]{8}$/.test(requestedBy) || !/^[A-Z0-9]{8}$/.test(signedBy)) {
    throw new ReceiptError('invalid');
  }
  // Pro forma, copies, training and advances must not become ordinary purchases.
  if (bytes[41] !== 0) throw new ReceiptError('invoice_type');
  if (bytes[42] > 1) throw new ReceiptError('invalid');

  const view = new DataView(bytes.buffer);
  const scaledAmount = view.getBigUint64(25, true);
  const timestamp = Number(view.getBigUint64(33));
  if (
    scaledAmount <= BigInt(0) ||
    scaledAmount > BigInt(Number.MAX_SAFE_INTEGER) ||
    !Number.isSafeInteger(timestamp) ||
    timestamp < Date.UTC(2000, 0, 1) ||
    timestamp >= Date.UTC(2100, 0, 1)
  ) {
    throw new ReceiptError('invalid');
  }
  return {
    amount: Number(scaledAmount) / 10000,
    currency: 'RSD',
    date: new Date(timestamp).toISOString(),
    number: `${requestedBy}-${signedBy}-${view.getUint32(17, true)}`,
    type: bytes[42] === 0 ? 'OUT' : 'IN',
    url: url.href,
  };
}
