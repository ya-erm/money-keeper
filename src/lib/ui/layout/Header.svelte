<script lang="ts">
  import { type Component } from 'svelte';

  import { translate } from '$lib/translate';

  import SyncState from './SyncState.svelte';
  import HeaderBackButton from './HeaderBackButton.svelte';
  import HeaderButton from './HeaderButton.svelte';

  export let title: string;
  export let onBack: VoidFunction | null = null;
  export let leftSlot: Component | null = null;
  export let rightSlot: Component | null = null;
  export let rightSlotProps: Record<string, unknown> = {};
  /** Show a close button instead of the back button on wide screens */
  export let closable = false;
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<div class="navigation-bar">
  <div class="navigation-back-button h-full">
    {#if leftSlot !== null}
      <svelte:component this={leftSlot} />
    {:else if onBack !== null}
      <span class="back-button" class:closable>
        <HeaderBackButton onClick={onBack} />
      </span>
      {#if closable}
        <span class="close-button">
          <HeaderButton icon="mdi:close" label={$translate('common.close')} onClick={onBack} />
        </span>
      {/if}
    {/if}
  </div>
  <div class="flex-grow flex-col flex-center">
    <h1 class="navigation-title my-0">
      <span class="relative">
        {title}
      </span>
    </h1>
    <SyncState />
  </div>

  <div class="navigation-right-button">
    {#if rightSlot !== null}
      <svelte:component this={rightSlot} {...rightSlotProps} />
    {/if}
  </div>
</div>

<style>
  .navigation-back-button {
    display: flex;
  }
  .navigation-back-button:hover {
    opacity: 0.9;
  }
  .navigation-back-button:active {
    opacity: 0.8;
  }
  .navigation-bar {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    background-color: var(--header-background-color);
    border-bottom: 1px solid var(--border-color);
    align-items: center;
    flex-shrink: 0;
    height: 60px;
  }
  .navigation-title {
    flex-grow: 1;
    font-weight: normal;
    text-align: center;
    font-size: 1.25rem;
    background: var(--header-background-color);
    z-index: 1;
  }
  .navigation-right-button {
    justify-self: flex-end;
  }
  .back-button {
    display: flex;
  }
  .close-button {
    display: none;
    padding-left: 0.5rem;
  }
  @media (min-width: 768px) {
    .back-button.closable {
      display: none;
    }
    .close-button {
      display: flex;
    }
  }
</style>
