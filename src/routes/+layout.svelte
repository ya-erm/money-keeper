<script lang="ts">
  import '$lib/translate';
  import Menu from '$lib/Menu.svelte';
  import Header from '$lib/Header.svelte';
  import ThemeProvider from '$lib/ThemeProvider.svelte';
</script>

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
