<script lang="ts">
  import { page } from '$app/stores';
  import { derived } from 'svelte/store';

  import { findRoute } from '$lib/routes';
  import { translate } from '$lib/translate';
  import Icon from '$lib/ui/Icon.svelte';

  import HeaderBackButton from './HeaderBackButton.svelte';
  import SyncState from './SyncState.svelte';
  import type { HeaderConfig } from './config';
  import { backLink, backLinkTitle, leftButton, rightButton, title } from './model';

  export let config: HeaderConfig = {};

  const titleText = derived([page, translate, title], ([page, translate, title]) => {
    if (config.title) return config.title;
    if (title) return title;
    const route = findRoute(page.url.pathname);
    return route ? translate(route.title) : '';
  });
</script>

<svelte:head>
  <title>{$titleText}</title>
</svelte:head>

<div class="navigation-bar">
  <div class="navigation-back-button">
    {#if config.backButton !== undefined}
      <HeaderBackButton {...config.backButton} />
    {:else if $backLink}
      <HeaderBackButton
        href={$backLink}
        onClick={() => backLink.set(null)}
        title={$backLinkTitle ?? $translate(findRoute($backLink)?.title ?? 'common.back')}
      />
    {/if}
    {#if config.leftButton !== undefined}
      <svelte:component this={config.leftButton} />
    {:else if $leftButton}
      <svelte:component this={$leftButton} />
    {/if}
  </div>
  <div class="flex-grow flex-col flex-center">
    <h1 class="navigation-title my-0">
      <span class="relative">
        {$titleText}
        {#if $page.url.pathname.startsWith('/beta')}
          <sup class="beta" title="Beta version">
            <Icon name="mdi:beta" size={1} padding={0} />
          </sup>
        {/if}
      </span>
    </h1>
    <SyncState />
  </div>

  <div class="navigation-right-button">
    {#if config.rightButton !== undefined}
      <svelte:component this={config.rightButton} />
    {:else if $rightButton}
      <svelte:component this={$rightButton} />
    {/if}
  </div>
</div>

<style>
  .navigation-back-button {
    position: absolute;
    left: 0;
    display: flex;
  }
  .navigation-back-button:hover {
    opacity: 0.9;
  }
  .navigation-back-button:active {
    opacity: 0.8;
  }
  .navigation-bar {
    display: flex;
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
  .beta {
    color: var(--red-color);
    position: absolute;
    opacity: 0.75;
    right: -1rem;
  }
  .navigation-right-button {
    position: absolute;
    right: 0;
  }
</style>
