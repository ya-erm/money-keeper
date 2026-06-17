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
  <span class="symbol symbol-1" aria-hidden="true"></span>
  <span class="symbol symbol-2" aria-hidden="true"></span>
  <span class="symbol symbol-3" aria-hidden="true"></span>
  <span class="symbol symbol-4" aria-hidden="true"></span>
  <span class="symbol symbol-5" aria-hidden="true"></span>
  {#if currency}
    <span class="currency">{currency}</span>
  {/if}
</span>

<style>
  .hidden-money {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.08em;
    min-width: 5.75em;
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
  .symbol {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 0.62em;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
    font-variant-numeric: tabular-nums;
    opacity: 0.82;
  }
  .symbol::before {
    content: '7';
    animation: hidden-money-cipher-1 1.8s steps(1, end) infinite;
  }
  .symbol-2 {
    opacity: 0.66;
  }
  .symbol-2::before {
    animation-name: hidden-money-cipher-2;
    animation-duration: 1.55s;
  }
  .symbol-3 {
    opacity: 0.92;
  }
  .symbol-3::before {
    animation-name: hidden-money-cipher-3;
    animation-duration: 2.05s;
  }
  .symbol-4 {
    opacity: 0.72;
  }
  .symbol-4::before {
    animation-name: hidden-money-cipher-4;
    animation-duration: 1.7s;
  }
  .symbol-5::before {
    animation-name: hidden-money-cipher-5;
    animation-duration: 1.9s;
  }
  .currency {
    margin-left: 0.25em;
    opacity: 0.65;
  }

  @keyframes hidden-money-cipher-1 {
    0% {
      content: '7';
    }
    16% {
      content: 'A';
    }
    32% {
      content: '3';
    }
    48% {
      content: 'K';
    }
    64% {
      content: '9';
    }
    80% {
      content: 'M';
    }
  }
  @keyframes hidden-money-cipher-2 {
    0% {
      content: 'R';
    }
    16% {
      content: '1';
    }
    32% {
      content: '8';
    }
    48% {
      content: 'Q';
    }
    64% {
      content: '4';
    }
    80% {
      content: 'Z';
    }
  }
  @keyframes hidden-money-cipher-3 {
    0% {
      content: '5';
    }
    16% {
      content: 'N';
    }
    32% {
      content: '2';
    }
    48% {
      content: 'V';
    }
    64% {
      content: '0';
    }
    80% {
      content: 'E';
    }
  }
  @keyframes hidden-money-cipher-4 {
    0% {
      content: 'C';
    }
    16% {
      content: '6';
    }
    32% {
      content: 'T';
    }
    48% {
      content: '9';
    }
    64% {
      content: 'L';
    }
    80% {
      content: '1';
    }
  }
  @keyframes hidden-money-cipher-5 {
    0% {
      content: '4';
    }
    16% {
      content: 'X';
    }
    32% {
      content: '8';
    }
    48% {
      content: 'B';
    }
    64% {
      content: '2';
    }
    80% {
      content: 'Y';
    }
  }
</style>
