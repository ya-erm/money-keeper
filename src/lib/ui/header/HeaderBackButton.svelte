<script lang="ts">
  import Icon from '$lib/ui/Icon.svelte';
  import { findRoute } from '$lib/routes';
  import { translate } from '$lib/translate';
  import Button from '../Button.svelte';

  export let href: string | null = null;
  export let onClick: (() => void) | null = null;
  export let title: string | null = null;
</script>

{#if href}
  <a {href} on:click={onClick}>
    <Icon name="mdi:chevron-left" />
    {title ?? $translate(findRoute(href)?.title ?? 'common.back')}
  </a>
{:else}
  <Button appearance="link" underlined={false} on:click={onClick}>
    <div class="flex items-center">
      <Icon name="mdi:chevron-left" />
      <span>
        {title ?? $translate('common.back')}
      </span>
    </div>
  </Button>
{/if}

<style>
  a {
    display: flex;
    align-items: center;
    color: var(--active-color);
    text-decoration: none;
    padding: 0.5rem;
  }
</style>
