<script lang="ts">
  import Icon from '@ya-erm/svelte-ui/Icon';

  import { translate } from '$lib/translate';

  export let currency: string | null | undefined = undefined;
  export let size: 'sm' | 'md' | 'lg' = 'md';
</script>

<span class="hidden-money" class:sm={size === 'sm'} class:lg={size === 'lg'} title={$translate('privacy.hidden_amount')}>
  <span class="symbol symbol-1">
    <Icon name="mdi:rhombus-medium" />
  </span>
  <span class="symbol symbol-2">
    <Icon name="mdi:circle-medium" />
  </span>
  <span class="symbol symbol-3">
    <Icon name="mdi:rhombus-medium" />
  </span>
  {#if currency}
    <span class="currency">{currency}</span>
  {/if}
</span>

<style>
  .hidden-money {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.12em;
    min-width: 4.5em;
    line-height: 1;
    color: currentColor;
    white-space: nowrap;
    vertical-align: baseline;
  }
  .hidden-money.sm {
    min-width: 3.5em;
    font-size: 0.9em;
  }
  .hidden-money.lg {
    min-width: 5.5em;
    font-size: 1.1em;
  }
  .symbol {
    display: inline-flex;
    animation: hidden-money-pulse 1.2s ease-in-out infinite;
  }
  .symbol-2 {
    animation-delay: 0.15s;
  }
  .symbol-3 {
    animation-delay: 0.3s;
  }
  .currency {
    margin-left: 0.25em;
    opacity: 0.65;
  }

  @keyframes hidden-money-pulse {
    0%,
    100% {
      transform: translateY(0);
      opacity: 0.45;
    }
    50% {
      transform: translateY(-0.12em);
      opacity: 1;
    }
  }
</style>
