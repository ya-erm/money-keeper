<script lang="ts">
  import { page } from '$app/stores';
  import { translate } from '$lib/translate';
  import { derived } from 'svelte/store';
  import { menu } from './store/menu';
  import { backLink } from './store/navigation';
  import { routes } from './store/routes';

  const isActive = derived(page, (page) => {
    return (path: string) => page.url.pathname === path;
  });

  const hidden = derived(page, (page) => {
    return [routes.login.path, routes.register.path].includes(page.url.pathname);
  });
</script>

<div class="menu-bar" class:hidden={$hidden}>
  {#each $menu as item}
    <a href={item.path} class="menu-item" class:active={$isActive(item.path)} on:click={() => backLink.set(null)}>
      <div
        class="icon"
        class:active={$isActive(item.path)}
        style={`mask-image:url('${item.icon}'); -webkit-mask-image:url('${item.icon}')`}
      />
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
    height: 60px;
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
  .menu-item:hover,
  .menu-item.active {
    color: var(--active-text-color);
  }
  .menu-item:active {
    opacity: 0.7;
  }
  .menu-item .icon {
    width: 30px;
    height: 30px;
    mask: no-repeat 50% 50%;
    background-color: var(--secondary-text-color);
  }
  .menu-item:hover .icon,
  .menu-item .icon.active {
    background-color: var(--active-color);
  }
  .menu-item .text {
    font-size: 0.7em;
  }
</style>
