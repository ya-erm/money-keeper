import { isApiErrorData, type ApiError, type ApiErrorData, type ApiErrorCode } from '$lib/api';
import { error, invalid } from '@sveltejs/kit';

export const serverApiError = (status: number, code: ApiErrorCode, message?: string) => {
  const e: ApiError = {
    status,
    code,
    message: message ?? code,
  };
  return error(status, e);
};

export const serverError = (status: number, code: ApiErrorCode, message?: string) => {
  const data: ApiErrorData = {
    error: {
      status,
      code,
      message: message ?? code,
    },
  };
  return invalid(status, data);
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
