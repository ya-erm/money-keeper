<script lang="ts">
  import { dev } from '$app/environment';
  import { page } from '$app/stores';
  import { inject } from '@vercel/analytics';

  import '$lib/icons';
  import '$lib/translate';

  import { membersService } from '$lib/data';
  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';
  import { showInfoToast } from '$lib/ui/toasts';
  import { getSearchParam } from '$lib/utils';

  import Layout from '$lib/ui/Layout.svelte';
  import ThemeProvider from '$lib/ui/theme/ThemeProvider.svelte';
  import Toasts from '$lib/ui/toasts/Toasts.svelte';

  inject({ mode: dev ? 'development' : 'production', debug: false });

  if (
    membersService.isGuest &&
    !getSearchParam($page, 'hideGuestToast') &&
    !$page.url.pathname.startsWith(routes.login.path)
  ) {
    showInfoToast($translate('auth.logged_in_as_guest_info'), { testId: 'guestToast' });
  }
</script>

<Toasts />

<Layout>
  <slot />
</Layout>
<ThemeProvider />

<style>
  :global(body) {
    margin: 0;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
      'Helvetica Neue', sans-serif;
  }
</style>
