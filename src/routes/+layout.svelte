<script lang="ts">
  import '../../static/styles.css';
  import { afterNavigate } from '$app/navigation';

  import { browser, dev } from '$app/environment';
  import { page } from '$app/state';
  import { inject } from '@vercel/analytics';

  import '$lib/icons';
  import '$lib/translate';

  import Toasts from '@ya-erm/svelte-ui/toasts/Toasts';
  import { showInfoToast } from '@ya-erm/svelte-ui/toasts';

  import { membersService } from '$lib/data';
  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';

  import ThemeProvider from '$lib/ui/theme/ThemeProvider.svelte';

  inject({ mode: dev ? 'development' : 'production', debug: false });

  // Initial / redirects to /accounts. Keep the shell until that navigation finishes.
  afterNavigate(() => {
    if (page.data.startupFailed) {
      document.getElementById('app-startup')?.setAttribute('data-startup-error', '');
      return;
    }
    if (page.url.pathname === '/' && !page.error) return;
    document.getElementById('app-startup')?.remove();
    document.getElementById('app-content')?.removeAttribute('inert');
  });

  const isAutomatedBrowser = browser && navigator.webdriver;

  if (!page.url.pathname.startsWith(routes.login.path) && membersService.isGuest && !isAutomatedBrowser) {
    showInfoToast($translate('auth.logged_in_as_guest_info'));
  }
</script>

<Toasts />
<ThemeProvider />

<slot />
