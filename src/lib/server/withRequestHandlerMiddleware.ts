/* eslint-disable @typescript-eslint/no-explicit-any */

import type { RequestHandler } from '@sveltejs/kit';

import { isApiError } from '$lib/api/ApiError';

import { serverErrorResponse } from './serverError';

/** Wrapper to add error handler */
export function withRequestHandlerMiddleware<T extends RequestHandler<any, any>>(handler: T): T {
  return (async (event) => {
    try {
      return await handler(event);
    } catch (error) {
      // catch ApiError and return it as Response
      if (isApiError(error)) {
        return serverErrorResponse(error);
      }
      throw error;
    }
  }) as T;
}
