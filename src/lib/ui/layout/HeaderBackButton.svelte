<script lang="ts">
  import Icon from '@ya-erm/svelte-ui/Icon';
  import Button from '@ya-erm/svelte-ui/Button';

  import { translate } from '$lib/translate';

  export let href: string | null = null;
  export let onClick: (() => void) | null = null;
  export let title: string | null = null;

  const goBack = () => {
    history.back();
  };
</script>

{#if href}
  <a class="link" {href} on:click={onClick}>
    <Icon name="mdi:chevron-left" padding="1rem 0" />
    {title ?? $translate('common.back')}
  </a>
{:else}
  <Button appearance="link" underlined={false} onClick={onClick ?? goBack}>
    <div class="flex items-center">
      <Icon name="mdi:chevron-left" padding="1rem 0" />
      {title ?? $translate('common.back')}
    </div>
  </Button>
{/if}

<style>
  .link {
    display: flex;
    align-items: center;
    color: var(--active-color);
    text-decoration: none;
    padding: 0.5rem;
  }
</style>
