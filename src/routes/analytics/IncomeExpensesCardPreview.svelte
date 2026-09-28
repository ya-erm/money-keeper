<script lang="ts">
  import dayjs from 'dayjs';

  import { currencyRatesStore, memberSettingsStore, operationsStore, settingsStore } from '$lib/data';
  import { translate } from '$lib/translate';
  import { findRate, formatMoney } from '$lib/utils';

  import { getIncomeExpensesPreview } from './incomeExpensesPreview';

  const chartWidth = 100;
  const chartHeight = 40;
  const verticalPadding = 3;
  const curveTension = 0.75;

  type Point = { x: number; y: number };

  $: mainCurrency = $memberSettingsStore?.currency ?? 'USD';
  $: preview = getIncomeExpensesPreview(
    $operationsStore,
    (currency) => findRate($currencyRatesStore, mainCurrency, currency),
    dayjs().subtract(1, 'month'),
  );
  $: amountsHidden = ($settingsStore.hideBalances ?? false) || preview.hasHiddenBalanceAccount;
  $: maxAmount = Math.max(...preview.incomeByMonth, ...preview.expensesByMonth, 0);

  const getPoints = (values: number[], max: number): Point[] =>
    values.map((value, index) => {
      const x = values.length > 1 ? (index / (values.length - 1)) * chartWidth : chartWidth / 2;
      const y = max
        ? chartHeight - verticalPadding - (value / max) * (chartHeight - verticalPadding * 2)
        : chartHeight / 2;
      return { x, y };
    });

  const getSmoothPath = (points: Point[]) => {
    if (!points.length) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    const clampY = (value: number) => Math.max(verticalPadding, Math.min(chartHeight - verticalPadding, value));
    let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

    for (let index = 0; index < points.length - 1; index += 1) {
      const previous = points[index - 1] ?? points[index];
      const current = points[index];
      const next = points[index + 1];
      const following = points[index + 2] ?? next;
      const control1X = current.x + ((next.x - previous.x) / 6) * curveTension;
      const control1Y = clampY(current.y + ((next.y - previous.y) / 6) * curveTension);
      const control2X = next.x - ((following.x - current.x) / 6) * curveTension;
      const control2Y = clampY(next.y - ((following.y - current.y) / 6) * curveTension);

      path += ` C ${control1X.toFixed(2)} ${control1Y.toFixed(2)}, ${control2X.toFixed(2)} ${control2Y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
    }

    return path;
  };

  $: incomePoints = getPoints(preview.incomeByMonth, maxAmount);
  $: expensesPoints = getPoints(preview.expensesByMonth, maxAmount);
  $: incomePath = getSmoothPath(incomePoints);
  $: expensesPath = getSmoothPath(expensesPoints);
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
      <g class="month-grid" aria-hidden="true">
        {#each incomePoints as point}
          <line x1={point.x} y1="0" x2={point.x} y2={chartHeight} />
        {/each}
      </g>
      <path class="line income-line" d={incomePath} />
      <path class="line expenses-line" d={expensesPath} />
      <g aria-hidden="true">
        {#each incomePoints as point}
          <ellipse class="point income-point" cx={point.x} cy={point.y} rx="0.45" ry="0.8" />
        {/each}
        {#each expensesPoints as point}
          <ellipse class="point expenses-point" cx={point.x} cy={point.y} rx="0.45" ry="0.8" />
        {/each}
      </g>
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

  .month-grid line {
    stroke: var(--border-color);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .point {
    fill: var(--background-color);
    stroke-width: 1.25;
    vector-effect: non-scaling-stroke;
  }

  .income-point {
    stroke: var(--green-color);
  }

  .expenses-point {
    stroke: var(--red-color);
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
