<script lang="ts">
  import { currencyRatesStore, memberSettingsStore, operationsStore } from '$lib/data';
  import { translate } from '$lib/translate';
  import { findRate, formatMoney } from '$lib/utils';

  import { getExpenseCategoriesPreview } from './categoryPreview';

  const colors = ['#2997d6', '#23a455', '#f3aa18', '#dc3f4f', '#8b5cf6'];
  const otherColor = '#a8adb4';

  $: mainCurrency = $memberSettingsStore?.currency ?? 'USD';
  $: preview = getExpenseCategoriesPreview($operationsStore, (currency) =>
    findRate($currencyRatesStore, mainCurrency, currency),
  );
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
    <ol class="category-legend" aria-label={$translate('analytics.cards.categories.month')}>
      {#each legendItems as item (item.id)}
        <li>
          <span class="color" style:background-color={item.color}></span>
          <span class="name">{item.name}</span>
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
    grid-template-columns: 4.5rem minmax(0, 1fr);
    align-items: center;
    gap: 1rem;
    min-height: 6rem;
    padding: 0.625rem 0.75rem;
  }

  .categories-preview.empty {
    display: flex;
    justify-content: center;
  }

  .donut {
    position: relative;
    display: block;
    width: 4.5rem;
    height: 4.5rem;
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
    display: flex;
    flex-direction: column;
    gap: 0.22rem;
    min-width: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .category-legend li {
    display: grid;
    grid-template-columns: 0.55rem minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.4rem;
    min-width: 0;
    font-size: 0.75rem;
    line-height: 1.15;
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

  .percentage,
  .empty-message {
    color: var(--secondary-text-color);
  }

  @media (max-width: 22rem) {
    .categories-preview {
      grid-template-columns: 3.75rem minmax(0, 1fr);
      gap: 0.625rem;
      padding-inline: 0.5rem;
    }

    .donut {
      width: 3.75rem;
      height: 3.75rem;
    }

    .donut::after {
      inset: 0.9rem;
    }
  }
</style>
