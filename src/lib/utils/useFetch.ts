import { ApiError } from '$lib/api/ApiError';
import { writable, type Readable } from 'svelte/store';

/**
 *
 * @param options
 * @example
 * const { fetch, loading } = useFetch('POST', '/api/auth/login');
 * await fetch({ login: "username", password: "password" })
 */
export function useFetch<TRequest = unknown, TResponse = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
) {
  const loading = writable(false);

  const fetchData = async (request?: TRequest) => {
    loading.set(true);
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: request ? JSON.stringify(request) : undefined,
      });
      const json = await response.json();
      if (!response.ok) {
        throw new ApiError(response.status, json.code, json.message);
      }
      return json as TResponse;
    } finally {
      loading.set(false);
    }
  };

  return {
    fetch: fetchData,
    loading: loading as Readable<boolean>,
  };
}
