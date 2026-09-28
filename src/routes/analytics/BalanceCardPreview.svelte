<script lang="ts">
  import dayjs from 'dayjs';

  import { accountsStore, currencyRatesStore, memberSettingsStore, operationsStore } from '$lib/data';
  import { activeLocale, translate } from '$lib/translate';
  import { findRate } from '$lib/utils';

  import { getBalancePreview, type BalancePreviewSeries } from './balancePreview';
  import { getNiceChartGrid } from './incomeExpensesPreview';

  const chartWidth = 100;
  const chartHeight = 40;
  const verticalPadding = 3;
  const curveTension = 0.9;
  const fallbackColors = ['#2997d6', '#23a455', '#f3aa18'];
  const otherColor = '#a8adb4';

  type Point = { x: number; y: number };
  type ChartSeries = BalancePreviewSeries & { color: string; points: Point[]; path: string; areaPath: string };

  $: mainCurrency = $memberSettingsStore?.currency ?? 'USD';
  $: preview = getBalancePreview(
    $accountsStore,
    $operationsStore,
    (currency) => findRate($currencyRatesStore, mainCurrency, currency),
    dayjs().subtract(1, 'month'),
  );
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
  $: maxAmount = Math.max(0, ...rawSeries.flatMap(({ values }) => values));
  $: chartGrid = getNiceChartGrid(maxAmount);
  $: chartSeries = rawSeries.map((series) => makeChartSeries(series, chartGrid.max));
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

  function makeChartSeries(series: BalancePreviewSeries & { color: string }, max: number): ChartSeries {
    const points = getPoints(series.values, max);
    const path = getSmoothPath(points);
    const first = points[0];
    const last = points.at(-1) ?? first;
    return {
      ...series,
      points,
      path,
      areaPath:
        first && last ? `${path} L ${last.x.toFixed(2)} ${chartHeight} L ${first.x.toFixed(2)} ${chartHeight} Z` : '',
    };
  }
</script>

<div class="balance-card-preview" class:empty={!chartSeries.length}>
  {#if chartSeries.length}
    <div class="chart-panel">
      <svg class="chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          {#each chartSeries as series (series.id)}
            <linearGradient
              id={`balance-preview-gradient-${series.id}`}
              x1="0"
              y1="0"
              x2="0"
              y2={chartHeight}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stop-color={series.color} stop-opacity="0.16" />
              <stop offset="1" stop-color={series.color} stop-opacity="0.01" />
            </linearGradient>
          {/each}
        </defs>
        {#each chartSeries.slice().reverse() as series (series.id)}
          <path class="area" d={series.areaPath} fill={`url('#balance-preview-gradient-${series.id}')`} />
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
    <ul class="legend" aria-label={$translate('analytics.cards.balance')}>
      {#each chartSeries as series (series.id)}
        <li><span class="color" style:background={series.color}></span><span>{series.name}</span></li>
      {/each}
    </ul>
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
  .point {
    fill: var(--background-color);
    stroke-width: 1.25;
    vector-effect: non-scaling-stroke;
  }
  .legend {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.5rem;
    align-items: center;
    margin: 0;
    padding: 0 0.5rem;
    border-top: 1px solid var(--border-color);
    list-style: none;
  }
  .legend li {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    min-width: 0;
    font-size: 0.65rem;
  }
  .legend li span:last-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .color {
    flex-shrink: 0;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
  }
  .empty-message {
    color: var(--secondary-text-color);
  }
</style>
