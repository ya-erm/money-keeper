<script lang="ts">
  import dayjs from 'dayjs';

  import { accountsStore, currencyRatesStore, memberSettingsStore, operationsStore, settingsStore } from '$lib/data';
  import { activeLocale, translate } from '$lib/translate';
  import { findRate, formatHiddenMoney, formatMoney } from '$lib/utils';

  import { getBalancePreview, getTotalBalanceAt, type BalancePreviewSeries } from './balancePreview';
  import { getNiceChartGrid } from './incomeExpensesPreview';

  const chartWidth = 100;
  const chartHeight = 40;
  const verticalPadding = 3;
  const curveTension = 0.9;
  const fallbackColors = ['#2997d6', '#23a455', '#f3aa18'];
  const otherColor = '#a8adb4';

  type Point = { x: number; y: number };
  type ChartSeries = BalancePreviewSeries & {
    color: string;
    points: Point[];
    path: string;
    areaPath: string;
  };

  $: mainCurrency = $memberSettingsStore?.currency ?? 'USD';
  $: getRate = (currency: string) => findRate($currencyRatesStore, mainCurrency, currency);
  $: preview = getBalancePreview($accountsStore, $operationsStore, getRate, dayjs().subtract(1, 'month'));
  $: rawSeries = [
    ...preview.series.map((series, index) => ({ ...series, color: series.color ?? fallbackColors[index] })),
    ...(preview.hasOther
      ? [
          {
            id: 'other',
            name: $translate('analytics.cards.balance.other'),
            color: otherColor,
            values: preview.otherValues,
          },
        ]
      : []),
  ];
  $: cumulativeSeries = rawSeries.reduce<((BalancePreviewSeries & { color: string }) & { lowerValues: number[] })[]>(
    (result, series) => {
      const lowerValues = result.at(-1)?.values ?? series.values.map(() => 0);
      result.push({
        ...series,
        lowerValues,
        values: series.values.map((value, index) => value + lowerValues[index]),
      });
      return result;
    },
    [],
  );
  $: maxAmount = Math.max(0, ...(cumulativeSeries.at(-1)?.values ?? []));
  $: chartGrid = getNiceChartGrid(maxAmount);
  $: chartSeries = cumulativeSeries.map((series) => makeChartSeries(series, series.lowerValues, chartGrid.max));
  $: now = dayjs();
  $: balanceYearAgo = getTotalBalanceAt($accountsStore, $operationsStore, getRate, now.subtract(1, 'year'));
  $: balanceNow = getTotalBalanceAt($accountsStore, $operationsStore, getRate, now.add(1, 'millisecond'));
  $: balanceDifference = balanceNow - balanceYearAgo;
  $: balancesHidden = ($settingsStore.hideBalances ?? false) || $accountsStore.some((account) => account.hideBalance);
  $: monthLabels = Array.from({ length: 12 }, (_, index) =>
    dayjs()
      .subtract(1, 'month')
      .subtract(11 - index, 'month')
      .locale($activeLocale === 'ru-RU' ? 'ru' : 'en')
      .format('MMM')
      .replace('.', '')
      .slice(0, 3),
  );

  function getPoints(values: number[], max: number): Point[] {
    return values.map((value, index) => ({
      x: values.length > 1 ? (index / (values.length - 1)) * chartWidth : 0,
      y: max ? chartHeight - verticalPadding - (value / max) * (chartHeight - verticalPadding * 2) : chartHeight / 2,
    }));
  }

  function getSmoothPath(points: Point[]) {
    if (!points.length) return '';
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
  }

  function makeChartSeries(
    series: BalancePreviewSeries & { color: string },
    lowerValues: number[],
    max: number,
  ): ChartSeries {
    const points = getPoints(series.values, max);
    const path = getSmoothPath(points);
    const lowerPath = getSmoothPath(getPoints(lowerValues, max).reverse()).replace(/^M/, 'L');
    return {
      ...series,
      points,
      path,
      areaPath: path && lowerPath ? `${path} ${lowerPath} Z` : '',
    };
  }

  const formatBalance = (value: number) =>
    balancesHidden ? formatHiddenMoney(mainCurrency) : formatMoney(value, { currency: mainCurrency, maxPrecision: 0 });

  const formatDifference = (value: number) => {
    const formatted = formatBalance(value);
    return !balancesHidden && value > 0 ? `+${formatted}` : formatted;
  };
</script>

<div class="balance-card-preview" class:empty={!chartSeries.length}>
  {#if chartSeries.length}
    <div class="chart-panel">
      <svg class="chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" aria-hidden="true">
        {#each chartSeries as series (series.id)}
          <path class="area" d={series.areaPath} fill={series.color} />
        {/each}
        <g class="month-grid">
          {#each chartSeries[0].points as point}
            <line x1={point.x} y1="0" x2={point.x} y2={chartHeight} />
          {/each}
        </g>
        <g class="amount-grid">
          <line x1="0" y1={chartHeight - verticalPadding} x2={chartWidth} y2={chartHeight - verticalPadding} />
          {#each chartGrid.values as value (value)}
            <line
              x1="0"
              y1={chartHeight - verticalPadding - (value / chartGrid.max) * (chartHeight - verticalPadding * 2)}
              x2={chartWidth}
              y2={chartHeight - verticalPadding - (value / chartGrid.max) * (chartHeight - verticalPadding * 2)}
            />
          {/each}
        </g>
        {#each chartSeries as series (series.id)}
          <path class="line" d={series.path} stroke={series.color} />
          {#each series.points as point}
            <ellipse class="point" cx={point.x} cy={point.y} rx="0.45" ry="0.8" stroke={series.color} />
          {/each}
        {/each}
      </svg>
      <div class="month-labels" aria-hidden="true">
        {#each monthLabels.slice(0, -1) as month}<span>{month}</span>{/each}
      </div>
    </div>
    <div class="balance-summary" aria-label={$translate('analytics.cards.balance')}>
      <span>{formatBalance(balanceYearAgo)}</span>
      <span class:positive={balanceDifference > 0} class:negative={balanceDifference < 0}>
        {formatDifference(balanceDifference)}
      </span>
      <span>{formatBalance(balanceNow)}</span>
    </div>
  {:else}
    <span class="empty-message">{$translate('analytics.cards.balance.no_balances')}</span>
  {/if}
</div>

<style>
  .balance-card-preview {
    display: grid;
    grid-template-rows: minmax(0, 1fr) 1.5rem;
    height: 100%;
  }
  .balance-card-preview.empty {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .chart-panel {
    display: grid;
    grid-template-rows: minmax(0, 1fr) 0.75rem;
    min-height: 0;
  }
  .chart {
    width: calc(100% - 1rem);
    height: 100%;
    margin: 0 0.5rem;
  }
  .month-labels {
    display: grid;
    grid-template-columns: repeat(11, minmax(0, 1fr));
    padding: 0 0.5rem;
    color: var(--secondary-text-color);
    font-size: 0.5rem;
    line-height: 1;
    text-align: left;
  }
  .month-grid line,
  .amount-grid line {
    stroke: color-mix(in srgb, var(--border-color) 78%, transparent);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }
  .line {
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }
  .area {
    opacity: 0.32;
  }
  .point {
    fill: var(--background-color);
    stroke-width: 1.25;
    vector-effect: non-scaling-stroke;
  }
  .balance-summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: center;
    padding: 0 0.5rem;
    border-top: 1px solid var(--border-color);
    font-size: 0.7rem;
    white-space: nowrap;
  }
  .balance-summary span:nth-child(2) {
    color: var(--secondary-text-color);
    text-align: center;
  }
  .balance-summary span:last-child {
    text-align: right;
  }
  .balance-summary .positive {
    color: var(--green-color);
  }
  .balance-summary .negative {
    color: var(--red-color);
  }
  .empty-message {
    color: var(--secondary-text-color);
  }
</style>
