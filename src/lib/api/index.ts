import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { Api } from '$lib/api/Api';

export { isApiErrorResponse } from './ApiError';
export type { ApiError, ApiErrorResponse, ApiErrorCode } from './ApiError';

export const api = new Api({
  baseUrl: 'http://localhost:4000',
  baseApiParams: {
    secure: true,
  },
  securityWorker: (data) => ({
    headers: { Authorization: `Bearer ${data}` },
    format: 'json',
  }),
  customFetch: (input, options) =>
    fetch(input, options).then((res) => {
      if (res.status === 401) {
        if (browser) {
          goto('/login');
        }
      }
      return res;
    }),
});
