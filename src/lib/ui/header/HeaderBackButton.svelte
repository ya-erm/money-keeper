<script lang="ts">
  import Icon from '@ya-erm/svelte-ui/Icon';
  import Button from '@ya-erm/svelte-ui/Button';

  import { findRoute } from '$lib/routes';
  import { translate } from '$lib/translate';

  export let href: string | null = null;
  export let onClick: (() => void) | null = null;
  export let title: string | null = null;

  const goBack = () => {
    history.back();
  };
</script>

{#if href}
  <a {href} on:click={onClick}>
    <Icon name="mdi:chevron-left" />
    {title ?? $translate(findRoute(href)?.title ?? 'common.back')}
  </a>
{:else}
  <Button appearance="link" underlined={false} onClick={onClick ?? goBack}>
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
