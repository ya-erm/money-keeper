<script lang="ts">
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

  const isAutomatedBrowser = browser && navigator.webdriver;

  if (!page.url.pathname.startsWith(routes.login.path) && membersService.isGuest && !isAutomatedBrowser) {
    showInfoToast($translate('auth.logged_in_as_guest_info'));
  }
</script>

<Toasts />
<ThemeProvider />

<slot />
