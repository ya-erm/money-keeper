<script lang="ts">
  import { dev } from '$app/environment';
  import { inject } from '@vercel/analytics';

  import '$lib/icons';
  import '$lib/translate';

  import Header from '$lib/ui/header/Header.svelte';
  import Menu from '$lib/ui/menu/Menu.svelte';
  import ThemeProvider from '$lib/ui/theme/ThemeProvider.svelte';
  import Toasts from '$lib/ui/toasts/Toasts.svelte';

  inject({ mode: dev ? 'development' : 'production' });
</script>

<Toasts />

<main>
  <Header />
  <div class="page">
    <slot />
  </div>
  <Menu />
  <ThemeProvider />
</main>

<style>
  :global(body) {
    margin: 0;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
      'Helvetica Neue', sans-serif;
  }

  main {
    display: flex;
    flex-direction: column;
    color: var(--primary-text-color);
    background-color: var(--background-color);
    padding: 0;
    height: 100vh;
    max-height: -webkit-fill-available;
  }

  .page {
    overflow-y: auto;
    flex-grow: 1;
  }
</style>
