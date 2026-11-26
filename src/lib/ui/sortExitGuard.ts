import { beforeNavigate, goto } from '$app/navigation';
import { writable } from 'svelte/store';

/** Defer client navigation while a reordered list still has an unsaved draft. */
export function sortExitGuard(
  state: () => { active: boolean; dirty: boolean; busy: boolean },
  defaultExit: () => string,
) {
  const opened = writable(false);
  let resume: (() => void | Promise<void>) | null = null;
  let permitNextNavigation = false;

  beforeNavigate((navigation) => {
    if (permitNextNavigation) {
      permitNextNavigation = false;
      return;
    }
    const current = state();
    if (!current.active || navigation.willUnload || !navigation.to) return;
    if (
      navigation.to.url.pathname === navigation.from?.url.pathname &&
      navigation.to.url.searchParams.get('action') === 'sort'
    )
      return;
    if (current.busy) {
      navigation.cancel();
      return;
    }
    if (!current.dirty) return;
    navigation.cancel();
    const target = navigation.to.url;
    const delta = navigation.type === 'popstate' ? navigation.delta : undefined;
    if (delta) resume = () => history.go(delta);
    else
      resume = () => {
        // The navigation target already includes the app base path.
        // eslint-disable-next-line svelte/no-navigation-without-resolve
        return goto(target.href, {
          replace: target.pathname === navigation.from?.url.pathname,
          reset: target.pathname === navigation.from?.url.pathname ? false : undefined,
        });
      };
    opened.set(true);
  });

  return {
    subscribe: opened.subscribe,
    dismiss() {
      resume = null;
      opened.set(false);
    },
    async finish() {
      const navigate =
        resume ??
        (() => {
          // The caller supplies the existing list's routed URL.
          // eslint-disable-next-line svelte/no-navigation-without-resolve
          return goto(defaultExit(), { replace: true, reset: false });
        });
      resume = null;
      opened.set(false);
      permitNextNavigation = true;
      try {
        await navigate();
      } catch (error) {
        permitNextNavigation = false;
        throw error;
      }
    },
  };
}
