import { showErrorToast } from '$lib/ui/toasts';

export function handleError(e: unknown | Error) {
  showErrorToast(`${e}`);
  console.error(e);
}
