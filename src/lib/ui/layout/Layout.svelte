<script lang="ts">
  import { page } from '$app/stores';

  import { routes } from '$lib/routes';
  import Menu from '$lib/ui/menu/Menu.svelte';
  import type { Component } from 'svelte';
  import Header from './Header.svelte';
  import { isWideScreen } from './media';

  export let title: string;
  export let onBack: VoidFunction | null = null;
  export let leftSlot: Component | null = null;
  export let rightSlot: Component | null = null;
  export let rightSlotProps: Record<string, unknown> = {};

  export let hideMenu = false;
  /** Render as a floating panel on wide screens (used by SubScreen) */
  export let panel = false;
  /** Keep the section overview in the middle column while this page opens on the right. */
  export let section: Component | null = null;
  export let sectionTitle = '';

  $: showMenu = !hideMenu && ![routes.login.path, routes.register.path].includes($page.url.pathname);
  $: workspace = showMenu && !panel;
  $: showSection = workspace && $isWideScreen && section !== null;
</script>

<main class:panel class:workspace>
  <div class="content" data-testId="PrimaryColumn">
    {#if showSection}
      <Header title={sectionTitle} />
      <div class="page">
        <svelte:component this={section} />
      </div>
    {:else}
      <Header {title} {onBack} {leftSlot} {rightSlot} {rightSlotProps} closable={panel} />
      <div class="page">
        <slot />
      </div>
    {/if}
  </div>
  {#if workspace && $isWideScreen}
    <aside class="details" data-testId="DetailsColumn">
      {#if showSection}
        <Header {title} {onBack} {leftSlot} {rightSlot} {rightSlotProps} />
        <div class="page">
          <slot />
        </div>
      {:else}
        <slot name="details" />
      {/if}
    </aside>
  {/if}
  {#if showMenu}
    <Menu />
  {/if}
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

  .content,
  .details {
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

  .details {
    overflow: hidden;
    border-right: 1px solid var(--border-color);
  }

  /* Tablet: menu and a single content column. */
  @media (min-width: 768px) {
    /* Sidebar and content are centered together as one block */
    main {
      flex-direction: row;
      justify-content: center;
    }
    .content {
      width: 100%;
      max-width: 48rem;
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

  /* Every desktop route reserves the same three columns, even without a selection. */
  @media (min-width: 1200px) {
    main.workspace {
      display: grid;
      grid-template-columns: 15rem 29rem 29rem;
      grid-template-rows: minmax(0, 1fr);
    }
    .workspace > .content {
      grid-column: 2;
      grid-row: 1;
      width: auto;
      max-width: none;
    }
    .details {
      grid-column: 3;
      grid-row: 1;
    }
  }
</style>
