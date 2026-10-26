export class QrDecoder {
  private worker = new Worker(new URL('./qrDecoder.worker.ts', import.meta.url), { type: 'module' });
  private pending?: { id: number; resolve: (value?: string) => void; reject: (error: Error) => void };
  private timeout?: ReturnType<typeof setTimeout>;
  private id = 0;
  private stopped = false;

  constructor() {
    this.worker.onmessage = ({ data }: MessageEvent<{ id: number; value?: string; error?: boolean }>) => {
      if (this.pending?.id !== data.id) return;
      clearTimeout(this.timeout);
      if (data.error) this.pending.reject(new Error('QR decoder failed'));
      else this.pending.resolve(data.value);
      this.pending = undefined;
    };
    this.worker.onerror = () => this.fail();
    this.worker.onmessageerror = () => this.fail();
  }

  decode(pixels: ImageData, thorough = false): Promise<string | undefined> {
    if (this.stopped) return Promise.resolve(undefined);
    if (this.pending) return Promise.reject(new Error('QR decoder already busy'));
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.pending = { id, resolve, reject };
      this.timeout = setTimeout(() => this.fail(), 20000);
      try {
        this.worker.postMessage({ id, pixels, thorough }, [pixels.data.buffer as ArrayBuffer]);
      } catch {
        this.fail();
      }
    });
  }

  private fail() {
    this.pending?.reject(new Error('QR decoder unavailable'));
    this.pending = undefined;
    this.destroy();
  }

  destroy() {
    this.stopped = true;
    clearTimeout(this.timeout);
    this.pending?.resolve(undefined);
    this.pending = undefined;
    this.worker.terminate();
  }
}
