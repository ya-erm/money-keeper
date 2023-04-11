export class ApiError extends Error {
  status: number;
  code: ApiErrorCode;

  constructor(status: number, code: ApiErrorCode, message?: string | undefined) {
    super(message ?? code);
    this.status = status;
    this.code = code;
  }
}

export function isApiError(e: unknown): e is ApiError {
  return !!e && typeof e === 'object' && 'status' in e && 'code' in e && 'message' in e;
}

export type ApiErrorData = {
  error: ApiError;
};

export function isApiErrorData(e: unknown): e is ApiErrorData {
  return !!e && typeof e === 'object' && 'error' in e;
}

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'BAD_REQUEST'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'
  | 'NOT_IMPLEMENTED'
  | 'USER_NOT_FOUND'
  | 'USER_ALREADY_EXISTS'
  | 'INCORRECT_LOGIN_OR_PASSWORD'
  | 'UNKNOWN_ERROR';
