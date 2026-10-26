import { describe, expect, it } from 'vitest';
import { qrCanvasSize, qrScanRegions } from './qrScanRegions';

describe('QR scan framing', () => {
  it('reads the visible square before the full landscape camera frame', () => {
    expect(qrScanRegions(3840, 2160, false)).toEqual([
      { x: 840, y: 0, width: 2160, height: 2160 },
      { x: 0, y: 0, width: 3840, height: 2160 },
    ]);
  });
  it('matches the portrait preview and does not duplicate a square frame', () => {
    expect(qrScanRegions(1080, 1920, false)[0]).toEqual({ x: 0, y: 420, width: 1080, height: 1080 });
    expect(qrScanRegions(1000, 1000, false)).toHaveLength(1);
  });
  it('covers photo edges with overlapping native-resolution regions', () => {
    const regions = qrScanRegions(4000, 3000, true);
    expect(regions).toHaveLength(5);
    expect(regions[1]).toEqual({ x: 0, y: 0, width: 2800, height: 2100 });
    expect(regions[4]).toEqual({ x: 1200, y: 900, width: 2800, height: 2100 });
    expect(qrCanvasSize(regions[1])).toEqual({ width: 2800, height: 2100 });
  });
  it('bounds photo memory without reducing ordinary camera pixels', () => {
    expect(qrCanvasSize({ x: 0, y: 0, width: 2160, height: 2160 })).toEqual({ width: 2160, height: 2160 });
    const size = qrCanvasSize({ x: 0, y: 0, width: 8000, height: 6000 });
    expect(size.width).toBeLessThanOrEqual(3200);
    expect(size.width * size.height).toBeLessThanOrEqual(6000000);
  });
});
