import { writable, type Readable } from 'svelte/store';

/**
 * Returns true only if loading takes more than delay (default 300ms).
 * If animation was started, it will be finished only after minDuration (default 1500ms).
 */
export function useSmartLoading(loading: Readable<boolean>, delay = 300, minDuration = 1500) {
  const smartLoading = writable(false);
  let timer1: NodeJS.Timeout | undefined;
  let timer2: NodeJS.Timeout | undefined;

  let _value = false;

  loading.subscribe((value) => {
    _value = value;
    if (value) {
      timer1 = setTimeout(() => {
        smartLoading.set(true);
        timer2 = setTimeout(() => {
          if (!_value) smartLoading.set(false);
          timer2 = undefined;
        }, minDuration);
      }, delay);
    } else {
      if (timer1) clearTimeout(timer1);
      if (!timer2) smartLoading.set(false);
    }
  });

  return smartLoading as Readable<boolean>;
}
