import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWorker } from 'tesseract.js';
import { recognizeReceiptText } from './recognizeReceiptText';

vi.mock('tesseract.js', () => ({ createWorker: vi.fn() }));
const image = {} as HTMLCanvasElement;

afterEach(() => {
  vi.resetAllMocks();
  vi.useRealTimers();
});

describe('local OCR lifecycle', () => {
  it('releases the worker after recognition', async () => {
    const worker = { recognize: vi.fn().mockResolvedValue({ data: { text: 'receipt' } }), terminate: vi.fn() };
    vi.mocked(createWorker).mockResolvedValue(worker as never);
    expect(await recognizeReceiptText(image, new AbortController().signal, vi.fn())).toBe('receipt');
    expect(worker.terminate).toHaveBeenCalled();
  });
  it('releases a worker that finishes initializing after cancellation', async () => {
    const worker = { recognize: vi.fn(), terminate: vi.fn() };
    let resolveWorker: ((worker: never) => void) | undefined;
    vi.mocked(createWorker).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveWorker = resolve;
        }),
    );
    const controller = new AbortController();
    const reading = recognizeReceiptText(image, controller.signal, vi.fn());
    const rejected = expect(reading).rejects.toThrow('cancelled');
    await vi.waitFor(() => expect(createWorker).toHaveBeenCalled());
    controller.abort();
    await rejected;
    resolveWorker?.(worker as never);
    await vi.waitFor(() => expect(worker.terminate).toHaveBeenCalled());
    expect(worker.recognize).not.toHaveBeenCalled();
  });
  it('times out an unresponsive worker and allows the UI to continue', async () => {
    vi.useFakeTimers();
    const worker = { recognize: vi.fn().mockImplementation(() => new Promise(() => {})), terminate: vi.fn() };
    vi.mocked(createWorker).mockResolvedValue(worker as never);
    const reading = recognizeReceiptText(image, new AbortController().signal, vi.fn());
    const rejected = expect(reading).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(120000);
    await rejected;
    expect(worker.terminate).toHaveBeenCalled();
  });
  it('handles model loading errors even when the library initialization promise stays pending', async () => {
    vi.mocked(createWorker).mockImplementation((_languages, _engine, options) => {
      options?.errorHandler?.(new Error('offline'));
      return new Promise(() => {});
    });
    await expect(recognizeReceiptText(image, new AbortController().signal, vi.fn())).rejects.toThrow('unavailable');
  });
});
