<script lang="ts">
  import { page } from '$app/stores';
  import { translate } from '$lib/translate';
  import { derived } from 'svelte/store';
  import { backLink, rightButton, title } from './store/navigation';
  import { findRoute } from './store/routes';

  const titleText = derived([page, translate, title], ([page, translate, title]) => {
    const route = findRoute(page.url.pathname);
    return route ? translate(route.title) : title ?? '';
  });
</script>

<svelte:head>
  <title>{$titleText}</title>
</svelte:head>

<div class="navigation-bar">
  <div class="navigation-back-button">
    {#if $backLink}
      <a href={$backLink} on:click={() => backLink.set(null)}>
        <span class="indicator" />
        {$translate(findRoute($backLink)?.title ?? 'common.back')}
      </a>
    {/if}
  </div>
  <div class="navigation-title">
    {$titleText}
  </div>
  <div class="navigation-right-button">
    {#if $rightButton}
      <svelte:component this={$rightButton} />
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
  .navigation-back-button a {
    display: flex;
    align-items: center;
    color: var(--active-color);
    text-decoration: none;
    padding: 5px;
  }
  .navigation-back-button .indicator {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    display: inline-block;
    background-color: var(--active-color);
    mask: url('/icons/chevron-left.svg') no-repeat 50% 50%;
  }
  .navigation-bar {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;
    background-color: var(--header-background-color);
    border-bottom: 1px solid var(--border-color);
    align-items: center;
    flex-shrink: 0;
    height: 60px;
  }
  .navigation-title {
    text-align: center;
    font-size: 18px;
  }
  .navigation-right-button {
    text-align: right;
  }
</style>
