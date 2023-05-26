<script lang="ts">
  import { page } from '$app/stores';
  import { findRoute } from '$lib/routes';
  import { translate } from '$lib/translate';
  import Icon from '$lib/ui/Icon.svelte';
  import { derived } from 'svelte/store';
  import { backLink, leftButton, rightButton, title } from './model';

  const titleText = derived([page, translate, title], ([page, translate, title]) => {
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
    {#if $backLink}
      <a href={$backLink} on:click={() => backLink.set(null)}>
        <Icon name="mdi:chevron-left" />
        {$translate(findRoute($backLink)?.title ?? 'common.back')}
      </a>
    {/if}
    {#if $leftButton}
      <svelte:component this={$leftButton} />
    {/if}
  </div>
  <h1 class="navigation-title my-0">
    <span class="relative">
      {$titleText}
      {#if !$page.url.pathname.startsWith('/v1')}
        <sup class="beta" title="Beta version">
          <Icon name="mdi:beta" size={1} padding={0} />
        </sup>
      {/if}
    </span>
  </h1>
  <div class="navigation-right-button">
    {#if $rightButton}
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
  .navigation-back-button a {
    display: flex;
    align-items: center;
    color: var(--active-color);
    text-decoration: none;
    padding: 0.5rem;
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
