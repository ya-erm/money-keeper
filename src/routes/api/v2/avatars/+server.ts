import { randomUUID } from 'node:crypto';
import { withRequestHandlerMiddleware } from '#lib/server/index.js';
import { checkAuth } from '#lib/server/utils/index.js';
import { convertAvatar, readAvatarBody } from '#lib/server/avatars/image.js';
import { avatarStorageRequest } from '#lib/server/avatars/storage.js';
import type { RequestHandler } from './$types';

const headers = { 'Cache-Control': 'no-store' };

export const POST = withRequestHandlerMiddleware<RequestHandler>(async ({ cookies, request, url }) => {
  const { uuid } = await checkAuth(cookies, request);
  if (request.headers.get('origin') !== url.origin)
    return Response.json({ error: 'invalid_origin' }, { status: 403, headers });
  if (request.headers.get('x-workspace-id') !== uuid)
    return Response.json({ error: 'wrong_workspace' }, { status: 403, headers });
  let image: Buffer;
  try {
    image = await convertAvatar(await readAvatarBody(request));
  } catch (error) {
    return Response.json(
      { error: 'invalid_image' },
      { status: error instanceof Error && error.message === 'too_large' ? 413 : 400, headers },
    );
  }
  const id = randomUUID();
  try {
    const result = await avatarStorageRequest(uuid, id, image);
    await result.body?.cancel();
    if (!result.ok) throw new Error('upload_failed');
    return Response.json({ id }, { status: 201, headers });
  } catch {
    return Response.json({ error: 'unavailable' }, { status: 503, headers });
  }
});
