import jsQR from 'jsqr';
import { readBarcodes, type ReaderOptions } from 'zxing-wasm/reader';

const options: ReaderOptions = {
  formats: ['QRCode'],
  tryHarder: true,
  tryRotate: true,
  tryInvert: true,
  tryDownscale: true,
  maxNumberOfSymbols: 1,
};

// Bound the memory used by the older JS fallback on high-resolution photos.
const fallbackPixels = (image: ImageData): ImageData => {
  const scale = Math.min(1, 1800 / Math.max(image.width, image.height));
  if (scale === 1) return image;
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const source =
        (Math.min(image.height - 1, Math.floor(y / scale)) * image.width +
          Math.min(image.width - 1, Math.floor(x / scale))) *
        4;
      data.set(image.data.subarray(source, source + 4), (y * width + x) * 4);
    }
  }
  return { data, width, height, colorSpace: 'srgb' };
};

export const decodeQrPixels = async (
  image: ImageData,
  wasmAvailable = true,
  thorough = false,
): Promise<string | undefined> => {
  if (wasmAvailable) {
    try {
      const results = await readBarcodes(image, options);
      const value = results.find((result) => result.isValid && result.text)?.text;
      if (value) return value;
      if (thorough) {
        const retry = await readBarcodes(image, { ...options, binarizer: 'GlobalHistogram', tryDenoise: true });
        const value = retry.find((result) => result.isValid && result.text)?.text;
        if (value) return value;
      }
    } catch {
      // A failed WASM load or unsupported runtime must still allow local QR reading.
    }
  }
  const pixels = fallbackPixels(image);
  return jsQR(pixels.data, pixels.width, pixels.height)?.data;
};
