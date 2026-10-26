import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { prepareZXingModule as prepareReader } from 'zxing-wasm/reader';
import { prepareZXingModule as prepareWriter, writeBarcode } from 'zxing-wasm/writer';
import { decodeQrPixels } from './qrPixels';

const sample = readFileSync(new URL('./fixtures/serbian-receipt.txt', import.meta.url), 'utf8').trim();
let qr: { data: Uint8ClampedArray; width: number; height: number };

beforeAll(async () => {
  prepareReader({
    overrides: { wasmBinary: readFileSync(new URL(import.meta.resolve('zxing-wasm/reader/zxing_reader.wasm'))) },
  });
  prepareWriter({
    overrides: { wasmBinary: readFileSync(new URL(import.meta.resolve('zxing-wasm/writer/zxing_writer.wasm'))) },
  });
  const encoded = await writeBarcode(sample, { format: 'QRCode', options: 'ecLevel=M' });
  expect(encoded.error).toBe('');
  expect(encoded.symbol.width).toBeGreaterThan(100);
  qr = encoded.symbol;
});

const image = (inverted: boolean, rotated: boolean): ImageData => {
  const size = qr.width * 3;
  const data = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const sx = Math.floor((rotated ? y : x) / 3);
      const sy = Math.floor((rotated ? size - 1 - x : y) / 3);
      const value = inverted ? 255 - qr.data[sy * qr.width + sx] : qr.data[sy * qr.width + sx];
      const index = (y * size + x) * 4;
      data[index] = data[index + 1] = data[index + 2] = value;
      data[index + 3] = 255;
    }
  }
  return { data, width: size, height: size, colorSpace: 'srgb' };
};

describe('local QR pixel decoding', () => {
  it.each([
    [false, false],
    [false, true],
    [true, false],
    [true, true],
  ])('reads a dense fiscal URL (inverted=%s, rotated=%s)', async (inverted, rotated) => {
    expect(await decodeQrPixels(image(inverted, rotated))).toBe(sample);
  });
  it('keeps local QR reading available without WASM', async () => {
    expect(await decodeQrPixels(image(false, false), false)).toBe(sample);
  });
  it('returns no value for a frame without a QR', async () => {
    const pixels = {
      data: new Uint8ClampedArray(40000).fill(255),
      width: 100,
      height: 100,
      colorSpace: 'srgb',
    } as ImageData;
    expect(await decodeQrPixels(pixels, true, true)).toBeUndefined();
  });
});
