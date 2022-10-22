import type { ApiError, ApiErrorCode } from '$lib/api';
import { invalid } from '@sveltejs/kit';

export const serverError = (status: number, code: ApiErrorCode, message?: string) => {
  const data: ApiError = {
    error: {
      status,
      code,
      message: message ?? code,
    },
  };
  return invalid(status, data);
};
