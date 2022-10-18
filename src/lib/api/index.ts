import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { Api } from '$lib/api/Api';

export const api = new Api({
  baseUrl: 'http://localhost:4000',
  baseApiParams: {
    secure: true,
  },
  securityWorker: (data) => ({
    headers: { Authorization: `Bearer ${data}` },
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
