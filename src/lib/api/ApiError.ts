import type { HttpResponse } from './Api';

export type ApiError = {
  error: {
    status: number;
    code: ApiErrorCode;
    message: string;
  };
};

export type ApiErrorResponse = HttpResponse<unknown, ApiError>;

export function isApiErrorResponse(e: unknown): e is ApiErrorResponse {
  return !!e && typeof e === 'object' && 'error' in e;
}

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'INCORRECT_LOGIN_OR_PASSWORD'
  | 'BAD_REQUEST'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'
  | 'NOT_IMPLEMENTED';
