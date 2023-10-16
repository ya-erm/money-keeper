<script lang="ts">
  import { page } from '$app/stores';
  import { derived } from 'svelte/store';

  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';
  import Icon from '$lib/ui/Icon.svelte';
  import { backLink } from '$lib/ui/header/model';

  import { menu } from './menu';

  const isActive = derived(page, (page) => {
    return (path: string) => page.url.pathname.startsWith(path);
  });

  const hidden = derived(page, (page) => {
    return [routes.login.path, routes.register.path].includes(page.url.pathname);
  });
</script>

<div class="menu-bar" class:hidden={$hidden}>
  {#each $menu as item}
    <a
      href={item.path}
      class="menu-item"
      data-testId="MenuItem"
      class:active={$isActive(item.path)}
      on:click={() => backLink.set(null)}
    >
      <Icon name={item.icon} size={1.5} />
      <span class="text">{$translate(item.title)}</span>
    </a>
  {/each}
</div>

<style>
  .menu-bar {
    display: flex;
    align-items: center;
    border-top: 1px solid var(--border-color);
    background-color: var(--header-background-color);
    padding-bottom: env(safe-area-inset-bottom);
  }
  .menu-bar.hidden {
    display: none;
  }
  .menu-item {
    flex-grow: 1;
    text-decoration: none;
    color: var(--secondary-text-color);
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    padding: 10px;
  }
  .menu-item.active {
    color: var(--active-color);
  }
  @media (hover: hover) {
    .menu-item:hover {
      color: var(--active-color);
    }
  }
  .menu-item:active {
    opacity: 0.7;
  }
  .menu-item .text {
    font-size: 0.7em;
  }
</style>
