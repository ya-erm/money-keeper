export type ApiError = {
  error: {
    status: number;
    code: ApiErrorCode;
    message: string;
  };
};

export function isApiError(e: unknown): e is ApiError {
  return !!e && typeof e === 'object' && 'error' in e;
}

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'BAD_REQUEST'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'
  | 'NOT_IMPLEMENTED'
  | 'USER_ALREADY_EXISTS'
  | 'INCORRECT_LOGIN_OR_PASSWORD';
