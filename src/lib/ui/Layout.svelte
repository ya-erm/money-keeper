<script lang="ts">
  import Header from '$lib/ui/header/Header.svelte';
  import Menu from '$lib/ui/menu/Menu.svelte';

  export let title: string | null = null;
</script>

<main>
  <Header text={title} />
  <div class="page">
    <slot />
  </div>
  <Menu />
</main>

<style>
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
