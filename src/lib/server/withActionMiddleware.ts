/* eslint-disable @typescript-eslint/no-explicit-any */

import { isApiError } from '$lib/api/ApiError';
import type { Action } from '@sveltejs/kit';
import { isServerError, serverError } from './serverError';

/** Wrapper to add error handler */
export function withActionMiddleware<T extends Action<any, any, any>>(action: T): T {
  return (async (event) => {
    try {
      return await action(event);
    } catch (error) {
      // catch ApiError and return it as ValidationError<ApiError>
      if (isApiError(error)) {
        return serverError(error);
      }
      if (isServerError(error)) {
        return error;
      }
      throw error;
    }
  }) as T;
}
