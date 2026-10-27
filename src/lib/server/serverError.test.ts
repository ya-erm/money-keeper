import { isHttpError } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { serverApiError } from './serverError';

describe('serverApiError', () => {
  it('preserves the API code and message in a SvelteKit 3 error', () => {
    try {
      serverApiError(401, 'UNAUTHORIZED', 'Sign in to continue');
      expect.unreachable('Expected an HTTP error');
    } catch (error) {
      expect(isHttpError(error, 401)).toBe(true);
      if (!isHttpError(error)) throw error;
      expect(error.body).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Sign in to continue',
      });
    }
  });
});
