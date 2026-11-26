export const AVATAR_SIZE = 512;
export const MAX_AVATAR_FILE_SIZE = 20 * 1024 * 1024;

export function participantAvatarUrl(id?: string): string | undefined {
  return typeof id === 'string' && /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(id)
    ? `/api/v2/avatars/${id}`
    : undefined;
}

/** Crop on the device so the original photo never leaves it. Encode losslessly here;
 * the server performs the single final WebP encoding at quality 95. */
export async function prepareAvatarImage(file: File): Promise<Blob> {
  if (!file.size || file.size > MAX_AVATAR_FILE_SIZE || !file.type.startsWith('image/'))
    throw new Error('invalid_image');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 100_000_000)
      throw new Error('invalid_image');
    const size = Math.min(image.naturalWidth, image.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = AVATAR_SIZE;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('invalid_image');
    context.imageSmoothingQuality = 'high';
    context.drawImage(
      image,
      (image.naturalWidth - size) / 2,
      (image.naturalHeight - size) / 2,
      size,
      size,
      0,
      0,
      AVATAR_SIZE,
      AVATAR_SIZE,
    );
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('invalid_image'))), 'image/png'),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function uploadAvatarImage(image: Blob, owner: string): Promise<string> {
  const response = await fetch('/api/v2/avatars', {
    method: 'POST',
    headers: { 'Content-Type': 'image/png', 'X-Workspace-Id': owner },
    body: image,
  });
  if (!response.ok) throw new Error(response.status === 401 ? 'sign_in' : 'upload_failed');
  const result = await response.json();
  if (!participantAvatarUrl(result.id)) throw new Error('upload_failed');
  return result.id;
}
