<script lang="ts">
  import { dev } from '$app/environment';
  import { page } from '$app/state';
  import { inject } from '@vercel/analytics';

  import '$lib/icons';
  import '$lib/translate';

  import { membersService } from '$lib/data';
  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';
  import { showInfoToast } from '$lib/ui/toasts';

  import Layout from '$lib/ui/Layout.svelte';
  import ThemeProvider from '$lib/ui/theme/ThemeProvider.svelte';
  import Toasts from '$lib/ui/toasts/Toasts.svelte';

  inject({ mode: dev ? 'development' : 'production', debug: false });

  if (!page.url.pathname.startsWith(routes.login.path) && membersService.isGuest) {
    showInfoToast($translate('auth.logged_in_as_guest_info'));
  }
</script>

<Toasts />

<Layout>
  <slot />
</Layout>

<ThemeProvider />
