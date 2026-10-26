import { prepareZXingModule } from 'zxing-wasm/reader';
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';
import { decodeQrPixels } from './qrPixels';

const initialize = async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    // Serve the matching WASM binary from this app, with no external CDN dependency.
    const response = await fetch(wasmUrl, { signal: controller.signal });
    if (!response.ok) return false;
    await prepareZXingModule({
      overrides: { wasmBinary: new Uint8Array(await response.arrayBuffer()) },
      fireImmediately: true,
    });
    return true;
  } finally {
    clearTimeout(timeout);
  }
};

const ready = initialize().catch(() => false);
const scope = self as unknown as Pick<Worker, 'postMessage' | 'onmessage'>;
scope.onmessage = async ({ data }: MessageEvent<{ id: number; pixels: ImageData; thorough: boolean }>) => {
  try {
    const value = await decodeQrPixels(data.pixels, await ready, data.thorough);
    scope.postMessage({ id: data.id, value });
  } catch {
    scope.postMessage({ id: data.id, error: true });
  }
};
