import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseSerbianReceipt, ReceiptError } from './serbianReceipt';

const sample = readFileSync(new URL('./fixtures/serbian-receipt.txt', import.meta.url), 'utf8').trim();
const unescaped = readFileSync(new URL('./fixtures/serbian-receipt-unescaped.txt', import.meta.url), 'utf8').trim();
const modified = (change: (bytes: Buffer) => void) => {
  const bytes = Buffer.from(new URL(sample).searchParams.get('vl') ?? '', 'base64');
  change(bytes);
  return `https://suf.purs.gov.rs/v/?vl=${encodeURIComponent(bytes.toString('base64'))}`;
};

describe('Serbian receipt QR', () => {
  it('reads the supplied real receipt using the documented byte order and scaling', () => {
    expect(parseSerbianReceipt(sample)).toEqual({
      amount: 525.7,
      currency: 'RSD',
      date: '2026-10-17T10:56:36.502Z',
      number: 'FTH7EX9W-FTH7EX9W-19890',
      type: 'OUT',
      url: sample,
    });
  });

  it('recognizes refunds as income', () => {
    expect(parseSerbianReceipt(modified((b) => (b[42] = 1))).type).toBe('IN');
  });

  it('reads literal base64 plus signs from the second real receipt and returns a reusable escaped URL', () => {
    const receipt = parseSerbianReceipt(unescaped);
    expect(receipt).toMatchObject({
      amount: 2055,
      currency: 'RSD',
      date: '2026-10-17T16:34:23.000Z',
      number: 'DB6Y57KP-DB6Y57KP-50348',
      type: 'OUT',
    });
    expect(receipt.url).toContain('%2B');
    expect(receipt.url).not.toContain('+');
    expect(parseSerbianReceipt(receipt.url)).toEqual(receipt);
  });

  it('accepts mixed escaped and literal base64 plus signs', () => {
    const mixed = unescaped.replace('+', '%2B');
    expect(parseSerbianReceipt(mixed)).toEqual(parseSerbianReceipt(unescaped));
  });

  it('does not accept an encoded space in a base64 payload', () => {
    expect(() => parseSerbianReceipt(unescaped.replace('+', '%20'))).toThrowError(new ReceiptError('invalid'));
  });

  it.each([1, 2, 3, 4])('rejects non-normal invoice type %i', (type) => {
    expect(() => parseSerbianReceipt(modified((b) => (b[41] = type)))).toThrowError(new ReceiptError('invoice_type'));
  });

  it.each([
    'https://example.com/v/?vl=AAAA',
    'https://suf.purs.gov.rs.example.com/v/?vl=AAAA',
    'http://suf.purs.gov.rs/v/?vl=AAAA',
    'https://suf.purs.gov.rs:444/v/?vl=AAAA',
    'https://user@suf.purs.gov.rs/v/?vl=AAAA',
    'https://suf.purs.gov.rs/other/?vl=AAAA',
    'not a link',
  ])('rejects unsupported URL %s', (url) => {
    expect(() => parseSerbianReceipt(url)).toThrowError(new ReceiptError('unsupported'));
  });

  it.each(['', 'AAAA', '!!!', 'A'.repeat(1300)])('rejects invalid data', (payload) => {
    expect(() => parseSerbianReceipt(`https://suf.purs.gov.rs/v/?vl=${payload}`)).toThrowError(
      new ReceiptError('invalid'),
    );
  });

  it.each([
    (b: Buffer) => (b[0] = 2),
    (b: Buffer) => (b[42] = 2),
    (b: Buffer) => (b[43] = 21),
    (b: Buffer) => (b[1] = 0),
    (b: Buffer) => b.writeBigUInt64LE(BigInt(0), 25),
    (b: Buffer) => b.writeBigUInt64LE(BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1), 25),
    (b: Buffer) => b.writeBigUInt64BE(BigInt(0), 33),
    (b: Buffer) => b.writeBigUInt64BE(BigInt('18446744073709551615'), 33),
  ])('rejects malformed public fields', (change) => {
    expect(() => parseSerbianReceipt(modified(change))).toThrowError(new ReceiptError('invalid'));
  });

  it('rejects truncated signature data', () => {
    const url = new URL(sample);
    url.searchParams.set(
      'vl',
      Buffer.from(url.searchParams.get('vl') ?? '', 'base64')
        .subarray(0, 100)
        .toString('base64'),
    );
    expect(() => parseSerbianReceipt(url.href)).toThrowError(new ReceiptError('invalid'));
  });
});
