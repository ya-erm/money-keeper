<script lang="ts">
  import dayjs from 'dayjs';

  import { currencyRatesStore, memberSettingsStore, operationsStore } from '$lib/data';
  import { translate } from '$lib/translate';
  import { findRate, formatMoney } from '$lib/utils';

  import Chart from '../balance/Chart.svelte';

  const currencyRates = $currencyRatesStore;
  const settings = $memberSettingsStore;
  $: operations = $operationsStore;

  const mainCurrency = settings?.currency ?? 'USD';

  $: findRateFn = (currency: string) => findRate(currencyRates, mainCurrency, currency);

  const monthsCount = 12;
  const startMonth = dayjs().startOf('month').subtract(monthsCount - 1, 'month');

  $: months = Array.from({ length: monthsCount }, (_, index) => startMonth.add(index, 'month'));

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
</script>

<div class="chart-container">
  <Chart
    type="line"
    updateMode="none"
    data={{
      labels: monthStats.map((x) => x.month.format('MMM YY')),
      datasets: [
        {
          label: $translate('categories.incomings'),
          data: monthStats.map((item) => item.income),
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22, 163, 74, 0.15)',
          fill: false,
          tension: 0.35,
          pointRadius: 3,
        },
        {
          label: $translate('categories.outgoings'),
          data: monthStats.map((item) => item.expenses),
          borderColor: '#dc2626',
          backgroundColor: 'rgba(220, 38, 38, 0.15)',
          fill: false,
          tension: 0.35,
          pointRadius: 3,
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
