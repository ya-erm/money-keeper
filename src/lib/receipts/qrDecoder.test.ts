import { afterEach, describe, expect, it, vi } from 'vitest';
import { QrDecoder } from './qrDecoder';

class WorkerMock {
  onmessage?: (event: { data: { id: number; value: string } }) => void;
  onerror?: () => void;
  onmessageerror?: () => void;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() {
    instances.push(this);
  }
}
const instances: WorkerMock[] = [];
const pixels = () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1, colorSpace: 'srgb' }) as ImageData;
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  instances.length = 0;
});

describe('QR worker lifecycle', () => {
  it('transfers a frame and receives its decoded value', async () => {
    vi.stubGlobal('Worker', WorkerMock);
    const decoder = new QrDecoder();
    const frame = pixels();
    const reading = decoder.decode(frame);
    expect(instances[0].postMessage).toHaveBeenCalledWith({ id: 1, pixels: frame, thorough: false }, [
      frame.data.buffer,
    ]);
    instances[0].onmessage?.({ data: { id: 1, value: 'decoded' } });
    expect(await reading).toBe('decoded');
    decoder.destroy();
  });
  it('settles pending work and terminates the worker when closed', async () => {
    vi.stubGlobal('Worker', WorkerMock);
    const decoder = new QrDecoder();
    const reading = decoder.decode(pixels());
    decoder.destroy();
    expect(await reading).toBeUndefined();
    expect(instances[0].terminate).toHaveBeenCalled();
    expect(await decoder.decode(pixels())).toBeUndefined();
  });
  it('releases an unresponsive worker after a bounded timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('Worker', WorkerMock);
    const decoder = new QrDecoder();
    const rejected = expect(decoder.decode(pixels())).rejects.toThrow('unavailable');
    await vi.advanceTimersByTimeAsync(20000);
    await rejected;
    expect(instances[0].terminate).toHaveBeenCalled();
  });
});
