import { goto } from '$app/navigation';
import { get } from 'svelte/store';
import { page } from '#lib/page.js';
import { handleError } from '#lib/utils/handleError.js';

const activeScreens = new Set<string>();
let pending = Promise.resolve();

function enqueue(task: () => Promise<void>) {
  pending = pending.then(task).catch(handleError);
}

/** Remove closed screens together, including a picker and its new-contact form. */
async function leaveClosedScreens() {
  const current = get(page);
  const stack = current.state.subScreens ?? [];
  let count = 0;
  while (count < stack.length && !activeScreens.has(stack[stack.length - count - 1])) count++;
  if (!count) return;

  await new Promise<void>((resolve) => {
    const unsubscribe = page.subscribe((next) => {
      if (next.state === current.state && next.url.href === current.url.href) return;
      unsubscribe();
      resolve();
    });
    history.go(-count);
  });
}

/** Local-state screens get a browser history step; routed screens already have one. */
export function subScreenHistory(_element: HTMLElement, onBack: VoidFunction | null) {
  if (!onBack) return;
  const id = crypto.randomUUID();
  const url = get(page).url.href;
  let close = onBack;
  let entered = false;
  activeScreens.add(id);

  const unsubscribe = page.subscribe((current) => {
    if (entered && !current.state.subScreens?.includes(id)) {
      entered = false;
      close();
    }
  });

  enqueue(async () => {
    if (!activeScreens.has(id) || get(page).url.href !== url) return;
    const current = get(page);
    // The current URL already includes the configured base path.
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    await goto(current.url.href, {
      shallow: true,
      reset: false,
      state: { ...current.state, subScreens: [...(current.state.subScreens ?? []), id] },
    });
    entered = true;
  });

  return {
    update(onBack: VoidFunction | null) {
      if (onBack) close = onBack;
    },
    destroy() {
      activeScreens.delete(id);
      unsubscribe();
      enqueue(leaveClosedScreens);
    },
  };
}
