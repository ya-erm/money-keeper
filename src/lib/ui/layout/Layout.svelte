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
  /** Render as a floating panel on wide screens (used by SubScreen) */
  export let panel = false;
</script>

<main class:panel>
  <div class="content">
    <Header {title} {onBack} {leftSlot} {rightSlot} {rightSlotProps} closable={panel} />
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

    main.panel {
      height: auto;
      max-height: calc(100vh - 4rem);
      width: 100%;
      max-width: var(--panel-width, 40rem);
      border: 1px solid var(--border-color);
      border-radius: 1.5rem;
      overflow: hidden;
      box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.2);
    }
    main.panel .content {
      max-width: none;
      border: none;
    }
  }
</style>
