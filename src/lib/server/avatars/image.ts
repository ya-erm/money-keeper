import sharp from 'sharp';

export const MAX_AVATAR_UPLOAD_BYTES = 2 * 1024 * 1024;

export async function convertAvatar(input: Uint8Array): Promise<Buffer> {
  if (!input.byteLength || input.byteLength > MAX_AVATAR_UPLOAD_BYTES) throw new Error('invalid_image');
  const image = sharp(input, { limitInputPixels: 16_000_000, pages: 1 });
  const metadata = await image.metadata();
  if (!['png', 'jpeg', 'webp'].includes(metadata.format ?? '')) throw new Error('invalid_image');
  return image.rotate().resize(512, 512, { fit: 'cover', position: 'centre' }).webp({ quality: 95 }).toBuffer();
}

/** Bound even chunked bodies; do not trust Content-Length. */
export async function readAvatarBody(request: Request): Promise<Uint8Array> {
  if (Number(request.headers.get('content-length')) > MAX_AVATAR_UPLOAD_BYTES) throw new Error('too_large');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('invalid_image');
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_AVATAR_UPLOAD_BYTES) {
        await reader.cancel();
        throw new Error('too_large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, length);
}
