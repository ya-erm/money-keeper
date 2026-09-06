<script lang="ts">
  import Menu from '$lib/ui/menu/Menu.svelte';
  import type { Component } from 'svelte';
  import Header from './Header.svelte';

  export let title: string;
  export let onBack: VoidFunction | null = null;
  export let leftSlot: Component | null = null;
  export let rightSlot: Component | null = null;
  export let rightSlotProps: Record<string, unknown> = {};

  export let hideMenu = false;
</script>

<main>
  <div class="content">
    <Header {title} {onBack} {leftSlot} {rightSlot} {rightSlotProps} />
    <div class="page">
      <slot />
    </div>
  </div>
  {#if !hideMenu}
    <Menu />
  {/if}
</main>

<style>
  main {
    --content-max-width: 48rem;

    display: flex;
    flex-direction: column;
    color: var(--primary-text-color);
    background-color: var(--background-color);
    padding: 0;
    height: 100vh;
    max-height: -webkit-fill-available;
  }

  .content {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    min-height: 0;
    min-width: 0;
  }

  .page {
    overflow-y: auto;
    flex-grow: 1;
  }

  /* Desktop: menu becomes a sidebar on the left, content is a centered column */
  @media (min-width: 768px) {
    main {
      flex-direction: row;
    }
    .content {
      width: 100%;
      max-width: var(--content-max-width);
      margin: 0 auto;
      border-left: 1px solid var(--border-color);
      border-right: 1px solid var(--border-color);
    }
  }
</style>
