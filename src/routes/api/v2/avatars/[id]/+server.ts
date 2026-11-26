import { withRequestHandlerMiddleware } from '#lib/server/index.js';
import { checkAuth } from '#lib/server/utils/index.js';
import { avatarStorageRequest } from '#lib/server/avatars/storage.js';
import { participantAvatarUrl } from '#lib/wallets/avatarImage.js';
import type { RequestHandler } from './$types';

export const GET = withRequestHandlerMiddleware<RequestHandler>(async ({ cookies, request, params }) => {
  const { uuid } = await checkAuth(cookies, request);
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!participantAvatarUrl(params.id)) return new Response(null, { status: 404, headers });
  try {
    const result = await avatarStorageRequest(uuid, params.id);
    if (!result.ok) {
      await result.body?.cancel();
      return new Response(null, { status: result.status === 404 ? 404 : 503, headers });
    }
    return new Response(result.body, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'private, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response(null, { status: 503, headers });
  }
});
