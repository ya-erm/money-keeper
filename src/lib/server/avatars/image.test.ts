import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { convertAvatar, MAX_AVATAR_UPLOAD_BYTES, readAvatarBody } from './image';

const image = () =>
  sharp({ create: { width: 900, height: 600, channels: 3, background: '#2563eb' } })
    .png()
    .toBuffer();

describe('avatar conversion', () => {
  it('produces a static square WebP without original metadata', async () => {
    const input = await sharp(await image())
      .withExif({ IFD0: { Artist: 'Private name' } })
      .png()
      .toBuffer();
    const output = await convertAvatar(input);
    const metadata = await sharp(output).metadata();
    expect(metadata).toMatchObject({ format: 'webp', width: 512, height: 512 });
    expect(metadata.exif).toBeUndefined();
    expect(metadata.pages ?? 1).toBe(1);
    expect(output.length).toBeLessThan(input.length);
  });
  it('rejects non-images, vector images, oversized payloads and oversized decoded images', async () => {
    await expect(convertAvatar(Buffer.from('not an image'))).rejects.toThrow();
    await expect(
      convertAvatar(Buffer.from('<svg width="10" height="10" xmlns="http://www.w3.org/2000/svg"></svg>')),
    ).rejects.toThrow();
    await expect(convertAvatar(new Uint8Array(MAX_AVATAR_UPLOAD_BYTES + 1))).rejects.toThrow();
    const large = await sharp({ create: { width: 5000, height: 4000, channels: 3, background: 'white' } })
      .png()
      .toBuffer();
    await expect(convertAvatar(large)).rejects.toThrow();
  });
  it('limits chunked bodies even with a missing or misleading Content-Length', async () => {
    let cancelled = false;
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(MAX_AVATAR_UPLOAD_BYTES));
        controller.enqueue(new Uint8Array(1));
      },
      cancel() {
        cancelled = true;
      },
    });
    const request = new Request('http://localhost', { method: 'POST', body: stream, duplex: 'half' } as RequestInit);
    await expect(readAvatarBody(request)).rejects.toThrow('too_large');
    expect(cancelled).toBe(true);
  });
});
