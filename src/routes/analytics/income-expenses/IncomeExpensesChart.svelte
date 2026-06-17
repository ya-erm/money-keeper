<script lang="ts">
  import dayjs from 'dayjs';

  import Button from '@ya-erm/svelte-ui/Button';
  import Icon from '@ya-erm/svelte-ui/Icon';

  import { currencyRatesStore, memberSettingsStore, operationsStore } from '$lib/data';
  import { translate } from '$lib/translate';
  import { findRate, formatMoney } from '$lib/utils';

  import Chart from '../balance/Chart.svelte';

  type GradientContext = {
    chart: {
      ctx: CanvasRenderingContext2D;
      chartArea?: {
        top: number;
        bottom: number;
      };
    };
  };

  const createLineGradient =
    (topColor: string, bottomColor: string, fallbackColor: string) =>
    ({ chart }: GradientContext) => {
      if (!chart.chartArea) return fallbackColor;

      const gradient = chart.ctx.createLinearGradient(0, chart.chartArea.top, 0, chart.chartArea.bottom);
      gradient.addColorStop(0, topColor);
      gradient.addColorStop(1, bottomColor);

      return gradient;
    };

  const incomeLineGradient = createLineGradient('rgba(22, 163, 74, 0.28)', 'rgba(22, 163, 74, 0)', '#16a34a');
  const expensesLineGradient = createLineGradient('rgba(220, 38, 38, 0.26)', 'rgba(220, 38, 38, 0)', '#dc2626');

  const currencyRates = $currencyRatesStore;
  const settings = $memberSettingsStore;
  $: operations = $operationsStore;

  const mainCurrency = settings?.currency ?? 'USD';

  $: findRateFn = (currency: string) => findRate(currencyRates, mainCurrency, currency);

  let interval: 6 | 12 | 24 = 12;
  let chartType: 'line' | 'bar' = 'line';

  const changeInterval = () => {
    if (interval === 6) interval = 12;
    else if (interval === 12) interval = 24;
    else interval = 6;
  };

  const changeChartType = () => {
    chartType = chartType === 'line' ? 'bar' : 'line';
  };

  $: startMonth = dayjs()
    .startOf('month')
    .subtract(interval - 1, 'month');

  $: months = Array.from({ length: interval }, (_, index) => startMonth.add(index, 'month'));

  $: monthStats = months.map((month) => {
    const monthOperations = operations.filter(
      (t) => dayjs(t.date).isSame(month, 'month') && !t.excludeFromAnalysis && !t.category.system,
    );

    let income = 0;
    let expenses = 0;

    monthOperations.forEach((operation) => {
      const amount = operation.amount * findRateFn(operation.account.currency);
      if (operation.category.type === 'IN') income += amount;
      else expenses += amount;
    });

    return {
      month,
      income,
      expenses,
    };
  });

  $: balanceDiff = monthStats.reduce((sum, item) => sum + item.income - item.expenses, 0);

  $: isLineChart = chartType === 'line';
</script>

<div class="chart-container">
  <div class="interval-button flex items-start gap-0.5">
    <Button color="white" bordered onClick={changeInterval}>
      <Icon name="mdi:arrow-expand-horizontal" />
      {interval}M
    </Button>
    <Button
      color="white"
      bordered
      onClick={changeChartType}
      title={isLineChart ? 'Показать столбики' : 'Показать линии'}
      aria-label={isLineChart ? 'Показать столбики' : 'Показать линии'}
    >
      <Icon name={isLineChart ? 'mdi:chart-bar' : 'mdi:chart-line'} />
    </Button>
  </div>
  {#key chartType}
    <Chart
      type={chartType}
      updateMode="none"
      data={{
        labels: monthStats.map((x) => x.month.format('MMM YY')),
        datasets: [
          {
            label: $translate('categories.incomings'),
            data: monthStats.map((item) => item.income),
            borderColor: '#16a34a',
            backgroundColor: isLineChart ? incomeLineGradient : '#16a34a',
            fill: isLineChart,
            tension: isLineChart ? 0.35 : 0,
            pointRadius: isLineChart ? 3 : 0,
            borderRadius: isLineChart ? 0 : 4,
          },
          {
            label: $translate('categories.outgoings'),
            data: monthStats.map((item) => item.expenses),
            borderColor: '#dc2626',
            backgroundColor: isLineChart ? expensesLineGradient : '#dc2626',
            fill: isLineChart,
            tension: isLineChart ? 0.35 : 0,
            pointRadius: isLineChart ? 3 : 0,
            borderRadius: isLineChart ? 0 : 4,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
        },
        scales: {
          y: {
            position: 'right',
          },
        },
      }}
    />
  {/key}
</div>

<div class="summary">
  <span>{$translate('analytics.income_expenses.total_diff')}:</span>
  <strong class:negative={balanceDiff < 0}>{formatMoney(balanceDiff, { currency: mainCurrency })}</strong>
</div>

<style>
  .chart-container {
    position: relative;
    height: calc(100% - 3rem);
    width: 100%;
    padding: 1rem;
  }
  .interval-button {
    position: absolute;
    top: 1rem;
    left: 1rem;
    z-index: 1;
  }
  .summary {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 0 1rem 1rem;
  }
  .negative {
    color: #dc2626;
  }
</style>
