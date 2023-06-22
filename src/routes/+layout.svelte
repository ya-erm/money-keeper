<script lang="ts">
  import { dev } from '$app/environment';
  import { inject } from '@vercel/analytics';

  import '$lib/icons';
  import '$lib/translate';

  import Layout from '$lib/ui/Layout.svelte';
  import ThemeProvider from '$lib/ui/theme/ThemeProvider.svelte';
  import Toasts from '$lib/ui/toasts/Toasts.svelte';

  inject({ mode: dev ? 'development' : 'production', debug: false });
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
