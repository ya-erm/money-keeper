import { isApiErrorResponse } from '$lib/api';
import { showToast } from '$lib/toasts';

export function showApiErrorToast(e: unknown) {
  if (isApiErrorResponse(e)) {
    const { error } = e.error;
    showToast({
      type: 'error',
      message: `${error.message}`,
      // TODO: use error.code for translate
    });
  }
}
