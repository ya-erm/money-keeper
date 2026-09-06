<script lang="ts">
  import { page } from '$app/stores';
  import { derived } from 'svelte/store';

  import Icon from '@ya-erm/svelte-ui/Icon';

  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';

  import { menu } from './menu';

  const isActive = derived(page, (page) => {
    return (path: string) => page.url.pathname.startsWith(path);
  });

  const hidden = derived(page, (page) => {
    return [routes.login.path, routes.register.path].includes(page.url.pathname);
  });
</script>

<nav class="menu-bar" class:hidden={$hidden}>
  <div class="menu-title">{$translate('app.title')}</div>
  {#each $menu as item (item.path)}
    <a href={item.path} class="menu-item" data-testId="MenuItem" class:active={$isActive(item.path)}>
      <Icon name={item.icon} size={1.5} />
      <span class="text">{$translate(item.title)}</span>
    </a>
  {/each}
</nav>

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
  .menu-title {
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

  /* Tablet: vertical rail with icons only */
  @media (min-width: 768px) {
    .menu-bar {
      order: -1;
      flex-direction: column;
      align-items: stretch;
      flex-shrink: 0;
      gap: 0.25rem;
      padding: 0.75rem 0.5rem;
      border-top: none;
      border-right: 1px solid var(--border-color);
    }
    .menu-item {
      flex-grow: 0;
      border-radius: 0.5rem;
      padding: 0.6rem 0.75rem;
    }
    .menu-item.active {
      background-color: var(--hover-background-color);
    }
    .menu-item .text {
      display: none;
    }
  }

  /* Desktop: full sidebar with labels */
  @media (min-width: 1024px) {
    .menu-bar {
      width: 15rem;
    }
    .menu-title {
      display: block;
      font-size: 1.25rem;
      font-weight: 600;
      padding: 0.5rem 0.75rem 1rem;
      color: var(--primary-text-color);
    }
    .menu-item {
      flex-direction: row;
      justify-content: flex-start;
      gap: 0.75rem;
    }
    .menu-item .text {
      display: inline;
      font-size: 1rem;
    }
  }
</style>
