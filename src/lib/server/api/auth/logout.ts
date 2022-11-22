import type { Cookies } from '@sveltejs/kit';

import { db } from '$lib/server';

export async function logout(locals: App.Locals, cookies: Cookies) {
  const session = cookies.get('session');

  // invalidate token
  if (session) {
    await db.authToken.update({
      where: { value: session },
      data: { invalidated: true },
    });
  }

  // clear locals
  locals.userId = null;
  locals.groupId = null;

  // eat the cookies
  cookies.delete('session');
}
