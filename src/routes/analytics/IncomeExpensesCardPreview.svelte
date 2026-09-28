<script lang="ts">
  import { currencyRatesStore, memberSettingsStore, operationsStore, settingsStore } from '$lib/data';
  import { translate } from '$lib/translate';
  import { findRate, formatMoney } from '$lib/utils';

  import { getIncomeExpensesPreview } from './incomeExpensesPreview';

  const chartWidth = 100;
  const chartHeight = 40;
  const verticalPadding = 3;

  $: mainCurrency = $memberSettingsStore?.currency ?? 'USD';
  $: preview = getIncomeExpensesPreview($operationsStore, (currency) =>
    findRate($currencyRatesStore, mainCurrency, currency),
  );
  $: amountsHidden = ($settingsStore.hideBalances ?? false) || preview.hasHiddenBalanceAccount;
  $: maxAmount = Math.max(...preview.incomeByDay, ...preview.expensesByDay, 0);

  const getPoints = (values: number[], max: number) =>
    values
      .map((value, index) => {
        const x = values.length > 1 ? (index / (values.length - 1)) * chartWidth : chartWidth / 2;
        const y = max
          ? chartHeight - verticalPadding - (value / max) * (chartHeight - verticalPadding * 2)
          : chartHeight / 2;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');

  $: incomePoints = getPoints(preview.incomeByDay, maxAmount);
  $: expensesPoints = getPoints(preview.expensesByDay, maxAmount);
</script>

<div class="income-expenses-card-preview">
  {#if preview.incomeTotal || preview.expensesTotal}
    <svg
      class="chart"
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={$translate('analytics.cards.income_expenses.month')}
    >
      <polyline class="line income-line" points={incomePoints} />
      <polyline class="line expenses-line" points={expensesPoints} />
    </svg>
    <dl class="summary">
      <div>
        <dt><span class="color income-color"></span>{$translate('categories.incomings')}</dt>
        <dd>
          {#if !amountsHidden}
            {formatMoney(preview.incomeTotal, { currency: mainCurrency, maxPrecision: 0 })}
          {/if}
        </dd>
      </div>
      <div>
        <dt><span class="color expenses-color"></span>{$translate('categories.outgoings')}</dt>
        <dd>
          {#if !amountsHidden}
            {formatMoney(-preview.expensesTotal, { currency: mainCurrency, maxPrecision: 0 })}
          {/if}
        </dd>
      </div>
    </dl>
  {:else}
    <span class="empty-message">{$translate('analytics.cards.income_expenses.no_operations')}</span>
  {/if}
</div>

<style>
  .income-expenses-card-preview {
    display: grid;
    grid-template-rows: minmax(0, 1fr) 3rem;
    height: 100%;
  }

  .chart {
    width: calc(100% - 1rem);
    height: calc(100% - 0.5rem);
    margin: 0.25rem 0.5rem;
  }

  .line {
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }

  .income-line {
    stroke: var(--green-color);
  }

  .expenses-line {
    stroke: var(--red-color);
  }

  .summary {
    display: grid;
    grid-template-rows: repeat(2, 1.5rem);
    margin: 0;
    border-top: 1px solid var(--border-color);
  }

  .summary > div {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    min-width: 0;
    padding: 0 0.5rem;
    font-size: 0.75rem;
    border-bottom: 1px solid var(--border-color);
  }

  .summary > div:last-child {
    border-bottom: 0;
  }

  dt {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  dd {
    margin: 0;
    white-space: nowrap;
  }

  .color {
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 50%;
  }

  .income-color {
    background: var(--green-color);
  }

  .expenses-color {
    background: var(--red-color);
  }

  .empty-message {
    align-self: center;
    justify-self: center;
    color: var(--secondary-text-color);
  }
</style>
