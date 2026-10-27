<script lang="ts">
  import '../../static/styles.css';
  import { afterNavigate } from '$app/navigation';

  import { browser, dev } from '$app/env';
  import { page } from '$app/state';
  import { inject } from '@vercel/analytics';

  import '#lib/icons.js';
  import '#lib/translate/index.js';

  import Toasts from '@ya-erm/svelte-ui/toasts/Toasts';
  import { showInfoToast } from '@ya-erm/svelte-ui/toasts';

  import { membersService } from '#lib/data/index.js';
  import { routes } from '#lib/routes.js';
  import { translate } from '#lib/translate/index.js';

  import ThemeProvider from '#lib/ui/theme/ThemeProvider.svelte';

  inject({ mode: dev ? 'development' : 'production', debug: false });

  // Initial / redirects to /accounts. Keep the shell until that navigation finishes.
  afterNavigate(({ shallow, type }) => {
    if (shallow && type === 'goto') return;

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

<Toasts /><ThemeProvider /><slot></slot>
