import { writable } from 'svelte/store';

export type ToastType = 'info' | 'success' | 'error';

export type ToastOptions = {
  message: string;
  type?: ToastType;
  dismissible?: boolean;
  timeout?: number;
  testId?: string;
};

export type Toast = Required<ToastOptions> & {
  id: number;
};

export const toasts = writable<Toast[]>([]);

export const showToast = (options: ToastOptions) => {
  const id = Math.floor(Math.random() * 10000);

  const defaults: Omit<Toast, 'message'> = {
    id,
    type: 'info',
    dismissible: true,
    timeout: 3000,
    testId: 'Toast',
  };
  const toast = { ...defaults, ...options };

  toasts.update((all) => [toast, ...all]);

  if (toast.dismissible) {
    setTimeout(() => hideToast(id), toast.timeout);
  }

  return { id };
};

export const showErrorToast = (message: string, options?: Partial<ToastOptions>) =>
  showToast({ ...options, type: 'error', message });

export const showSuccessToast = (message: string, options?: Partial<ToastOptions>) =>
  showToast({ ...options, type: 'success', message });

export const showInfoToast = (message: string, options?: Partial<ToastOptions>) =>
  showToast({ ...options, type: 'info', message });

export const hideToast = (id: number) => {
  toasts.update((all) => all.filter((t) => t.id !== id));
};
