<script lang="ts">
  import { Line } from 'svelte-chartjs';

  import {
    CategoryScale,
    Chart,
    Filler,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    Title,
    Tooltip,
  } from 'chart.js';
  import dayjs from 'dayjs';

  import { accountsStore, currencyRatesStore, memberSettingsStore, operationsStore } from '$lib/data';
  import { useRightButton } from '$lib/ui/header';
  import { groupBySelector } from '$lib/utils';

  import { calculateBalance, operationBeforeDatePredicate, pastOperationsPredicate } from '../../accounts/utils';
  import AnalyticsButtons from '../AnalyticsButtons.svelte';
  import { findRate } from '../utils/findRate';

  useRightButton(AnalyticsButtons);

  Chart.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, Filler);

  const currencyRates = $currencyRatesStore;
  const accounts = $accountsStore;
  const operations = $operationsStore;
  const settings = $memberSettingsStore;

  const mainCurrency = settings?.currency ?? 'USD';

  const findRateFn = (currency: string) => findRate(currencyRates, mainCurrency, currency);

  const operationsByAccount = groupBySelector(operations.filter(pastOperationsPredicate()), (t) => t.account.id);

  const startDate = dayjs().subtract(12, 'month');
  const step: 'day' | 'week' | 'month' = 'day';
  const endDate = dayjs();

  type AccountBalance = {
    balance: number;
    ratedBalance: number;
  };

  type Item = {
    date: Date;
    accountBalance: Record<string, AccountBalance>;
    sum: number;
  };

  const items: Item[] = [];

  const beforeStartDate = accounts.reduce((acc: Record<string, AccountBalance>, account) => {
    const previousOperations = operationsByAccount[account.id]?.filter(
      operationBeforeDatePredicate(startDate.toDate()),
    );
    const balance = calculateBalance(previousOperations ?? []);
    const ratedBalance = findRateFn(account.currency) * balance;
    acc[account.id] = {
      balance,
      ratedBalance: ratedBalance < 0 ? 0 : ratedBalance,
    };
    return acc;
  }, {});

  items.push({
    date: startDate.subtract(1, 'day').toDate(),
    accountBalance: beforeStartDate,
    sum: Object.values(beforeStartDate).reduce((sum, { ratedBalance }) => sum + ratedBalance, 0),
  });

  let max = items[0].sum;
  let min = items[0].sum;

  let cursor = startDate.startOf('day');

  while (cursor < endDate) {
    const item = accounts.reduce((acc: Record<string, AccountBalance>, account) => {
      const previousItem = items[items.length - 1];
      const operationsByDate = operationsByAccount[account.id]?.filter(
        (operation) =>
          dayjs(operation.date).isAfter(previousItem.date) &&
          dayjs(operation.date).isBefore(dayjs(previousItem.date).add(1, step)),
      );
      const previousBalance = previousItem.accountBalance[account.id].balance;
      const balance = previousBalance + calculateBalance(operationsByDate ?? []);
      const ratedBalance = findRateFn(account.currency) * balance;
      acc[account.id] = {
        balance,
        ratedBalance: ratedBalance < 0 ? 0 : ratedBalance,
      };
      return acc;
    }, {});
    const sum = Object.values(item).reduce((sum, { ratedBalance }) => sum + ratedBalance, 0);
    if (sum > max) max = sum;
    if (sum < min) min = sum;
    items.push({
      date: cursor.toDate(),
      accountBalance: item,
      sum,
    });
    cursor = cursor.add(1, step);
  }
</script>

<div class="chart-container">
  <Line
    options={{
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { stacked: true },
      },
      elements: {
        line: { tension: 0.1 },
      },
      interaction: {
        intersect: false,
      },
    }}
    data={{
      labels: items.map((x) => dayjs(x.date).format('DD.MM')),
      datasets: accounts.reverse().map((account) => ({
        label: account.name,
        data: items.map((item) => item.accountBalance[account.id].ratedBalance),
        backgroundColor: account.color,
        fill: true,
        pointRadius: 0,
        // hidden: true,
      })),
    }}
  />
</div>

<style>
  .chart-container {
    position: relative;
    height: 100%;
    width: 100%;
  }
</style>
