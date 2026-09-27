<script lang="ts">
  import { currencyRatesStore, memberSettingsStore, operationsStore, settingsStore } from '$lib/data';
  import { translate } from '$lib/translate';
  import { findRate, formatMoney } from '$lib/utils';

  import { getExpenseCategoriesPreview } from './categoryPreview';

  const colors = ['#2997d6', '#23a455', '#f3aa18'];
  const otherColor = '#a8adb4';

  $: mainCurrency = $memberSettingsStore?.currency ?? 'USD';
  $: preview = getExpenseCategoriesPreview($operationsStore, (currency) =>
    findRate($currencyRatesStore, mainCurrency, currency),
  );
  $: balancesHidden = ($settingsStore.hideBalances ?? false) || preview.hasHiddenBalanceAccount;
  $: legendItems = [
    ...preview.categories.map((category, index) => ({ ...category, color: colors[index] })),
    ...(preview.otherAmount > 0
      ? [
          {
            id: 'other',
            name: $translate('analytics.cards.categories.other'),
            amount: preview.otherAmount,
            percentage: preview.otherPercentage,
            color: otherColor,
          },
        ]
      : []),
  ];
  $: donutGradient = (() => {
    let start = 0;
    const segments = legendItems.map((item) => {
      const end = start + item.percentage;
      const segment = `${item.color} ${start}% ${end}%`;
      start = end;
      return segment;
    });
    return `conic-gradient(${segments.join(', ')})`;
  })();

  const formatPercent = (value: number) => `${formatMoney(value, { maxPrecision: value >= 10 ? 0 : 1 })}%`;
</script>

<div class="categories-preview" class:empty={!preview.total}>
  {#if preview.total}
    <span class="donut" style:background={donutGradient} aria-hidden="true"></span>
    <ol
      class="category-legend"
      class:amounts-hidden={balancesHidden}
      aria-label={$translate('analytics.cards.categories.month')}
    >
      {#each legendItems as item (item.id)}
        <li>
          <span class="category-name">
            <span class="color" style:background-color={item.color}></span>
            <span class="name">{item.name}</span>
          </span>
          {#if !balancesHidden}
            <span class="amount">{formatMoney(-item.amount, { currency: mainCurrency })}</span>
          {/if}
          <span class="percentage">{formatPercent(item.percentage)}</span>
        </li>
      {/each}
    </ol>
  {:else}
    <span class="empty-message">{$translate('analytics.cards.categories.no_expenses')}</span>
  {/if}
</div>

<style>
  .categories-preview {
    display: grid;
    grid-template-columns: 25% minmax(0, 1fr);
    align-items: center;
    min-height: 6rem;
  }

  .categories-preview.empty {
    display: flex;
    justify-content: center;
  }

  .donut {
    position: relative;
    display: block;
    width: min(4.5rem, calc(100% - 0.75rem));
    aspect-ratio: 1;
    justify-self: center;
    border-radius: 50%;
  }

  .donut::after {
    position: absolute;
    inset: 1.1rem;
    content: '';
    background: var(--header-background-color);
    border-radius: inherit;
  }

  .category-legend {
    display: grid;
    grid-auto-rows: 1.5rem;
    align-self: stretch;
    min-width: 0;
    margin: 0;
    padding: 0;
    border-left: 1px solid var(--border-color);
    list-style: none;
  }

  .category-legend li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(4.75rem, auto) 3rem;
    align-items: center;
    min-width: 0;
    font-size: 0.75rem;
    line-height: 1.15;
    border-bottom: 1px solid var(--border-color);
  }

  .category-legend li:last-child {
    border-bottom: 0;
  }

  .category-legend.amounts-hidden li {
    grid-template-columns: minmax(0, 1fr) 3rem;
  }

  .category-name {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    min-width: 0;
    padding: 0 0.5rem;
  }

  .color {
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 50%;
  }

  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .amount,
  .percentage {
    align-self: stretch;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 0.4rem;
    white-space: nowrap;
    border-left: 1px solid var(--border-color);
  }

  .percentage,
  .empty-message {
    color: var(--secondary-text-color);
  }

  @media (max-width: 22rem) {
    .category-legend li {
      grid-template-columns: minmax(0, 1fr) minmax(4rem, auto) 2.65rem;
      font-size: 0.68rem;
    }

    .category-legend.amounts-hidden li {
      grid-template-columns: minmax(0, 1fr) 2.65rem;
    }

    .donut::after {
      inset: 0.9rem;
    }

    .category-name {
      gap: 0.3rem;
      padding-inline: 0.35rem;
    }

    .amount,
    .percentage {
      padding-inline: 0.25rem;
    }
  }
</style>
