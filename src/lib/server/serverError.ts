import { isApiErrorData, ApiError, type ApiErrorData, type ApiErrorCode } from '$lib/api';
import { isApiError } from '$lib/api/ApiError';
import { error, fail, type NumericRange } from '@sveltejs/kit';

type ApiErrorArgs = [status: number, code: ApiErrorCode, message?: string | undefined] | [error: ApiError];

const mapApiErrorArgs = (args: ApiErrorArgs) => {
  if (typeof args[0] === 'number' && args[1]) {
    const [status, code, message] = args;
    return new ApiError(status, code, message);
  }

  if (isApiError(args[0])) {
    return args[0];
  }

  throw new Error('Invalid arguments. Expected (status, code, message) | {status, code, message}');
};

export const serverErrorResponse = (...args: ApiErrorArgs) => {
  const { status, code, message } = mapApiErrorArgs(args);
  return new Response(JSON.stringify({ status, code, message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const serverApiError = (...args: ApiErrorArgs) => {
  const apiError = mapApiErrorArgs(args);
  return error(apiError.status as NumericRange<400, 599>, apiError);
};

export const serverError = (...args: ApiErrorArgs) => {
  const { status, code, message } = mapApiErrorArgs(args);
  const data: ApiErrorData = {
    error: { name: 'ApiError', status, code, message },
  };
  return fail(status, data);
};

function hasStatus(e: unknown): e is { status: number } {
  return !!e && typeof e === 'object' && 'status' in e;
}

function hasData(e: unknown): e is { data: unknown } {
  return !!e && typeof e === 'object' && 'data' in e;
}
export function isServerError(e: unknown): e is { status: number; data: ApiErrorData } {
  return hasStatus(e) && hasData(e) && isApiErrorData(e.data);
}

export function isRedirect(e: unknown): e is { status: 302; location: string } {
  return hasStatus(e) && e.status === 302 && 'location' in e;
}
