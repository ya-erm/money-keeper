<script lang="ts">
  import { translate } from '$lib/translate';

  export let currency: string | null | undefined = undefined;
  export let size: 'sm' | 'md' | 'lg' = 'md';
</script>

<span
  class="hidden-money"
  class:sm={size === 'sm'}
  class:lg={size === 'lg'}
  title={$translate('privacy.hidden_amount')}
>
  <span class="symbols" aria-hidden="true">******</span>
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
    min-width: 5.5em;
    line-height: 1;
    color: currentColor;
    white-space: nowrap;
    vertical-align: baseline;
  }
  .hidden-money.sm {
    min-width: 4.75em;
    font-size: 0.9em;
  }
  .hidden-money.lg {
    min-width: 6.5em;
    font-size: 1.1em;
  }
  .symbols {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
    letter-spacing: 0;
    opacity: 0.82;
  }
  .currency {
    margin-left: 0.25em;
    opacity: 0.65;
  }
</style>
