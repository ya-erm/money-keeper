import { showErrorToast } from '@ya-erm/svelte-ui/toasts';

export function handleError(e: unknown | Error) {
  showErrorToast(`${e}`);
  console.error(e);
}
