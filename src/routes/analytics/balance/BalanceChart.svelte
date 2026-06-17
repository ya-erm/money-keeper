<script lang="ts">
  import dayjs from 'dayjs';

  import Button from '@ya-erm/svelte-ui/Button';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import Portal from '@ya-erm/svelte-ui/Portal';

  import { accountsStore, currencyRatesStore, memberSettingsStore, operationsStore, settingsStore } from '$lib/data';
  import { type Account } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Layout from '$lib/ui/layout/Layout.svelte';

  import { findRate, formatHiddenMoney, formatMoney } from '$lib/utils';

  import BalanceChartLegend from './BalanceChartLegend.svelte';
  import Chart from './Chart.svelte';
  import { getAccountBalanceChartData } from './chartData';

  $: currencyRates = $currencyRatesStore ?? [];
  $: accounts = $accountsStore ?? [];
  $: operations = $operationsStore ?? [];
  $: settings = $memberSettingsStore;

  $: accountsOrder = settings?.accountsOrder ?? [];

  const getAccountOrder = (account: Account) => {
    const index = accountsOrder.findIndex((id) => id === account.id);
    return index < 0 ? accounts.length : index;
  };

  $: sortedAccounts = accounts
    .slice()
    .sort((a, b) => getAccountOrder(a) - getAccountOrder(b))
    .reverse();

  $: mainCurrency = settings?.currency ?? 'USD';
  $: balancesHidden = $settingsStore?.hideBalances ?? false;

  $: findRateFn = (currency: string) => findRate(currencyRates, mainCurrency, currency);

  let interval: 1 | 3 | 6 | 12 | 24 = 12;

  const changeInterval = () => {
    if (interval === 1) interval = 3;
    else if (interval === 3) interval = 6;
    else if (interval === 6) interval = 12;
    else if (interval === 12) interval = 24;
    else interval = 1;
  };

  const endDate = dayjs();
  $: startDate = endDate.startOf('month').subtract(interval, 'month');
  const step: 'day' | 'week' | 'month' = 'day';

  let legendVisible = false;

  $: selectedAccounts = accounts.map((account) => account.id);

  const handleAccountCheckedApply = (value: string[]) => {
    selectedAccounts = value;
    legendVisible = false;
  };

  $: filteredAccounts = sortedAccounts.filter((account) => selectedAccounts.includes(account.id));

  $: items = getAccountBalanceChartData({
    operations,
    accounts: filteredAccounts,
    startDate,
    step,
    endDate,
    findRateFn,
  });
</script>

<div class="chart-container">
  <div class="legend-button flex items-start gap-0.5">
    <Button color="white" bordered onClick={changeInterval}>
      <Icon name="mdi:arrow-expand-horizontal" />
      {interval}M
    </Button>
    <Button color="white" bordered onClick={() => (legendVisible = true)}>
      <Icon name="mdi:format-list-bulleted" />
    </Button>
  </div>
  <Chart
    type="line"
    updateMode="none"
    data={{
      labels: items.map((x) => dayjs(x.date).format('DD.MM')),
      datasets: filteredAccounts.map((account) => ({
        label: account.name,
        data: items.map((item) => item.accountBalance[account.id].ratedBalance),
        backgroundColor: account.color ?? 'gray',
        fill: true,
        pointRadius: 0,
      })),
    }}
    options={{
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          stacked: true,
          position: 'right',
          grid: { z: 1 },
          ticks: {
            callback: (value) => (balancesHidden ? '' : value),
          },
        },
        x: {
          grid: { z: 1 },
          ticks: {
            autoSkip: false,
            callback: (_value, index) => {
              const sameDayOfMonth = dayjs(items[index].date).date() === 1;
              if (sameDayOfMonth) {
                return dayjs(items[index].date).format('MMM');
              }
              return null;
            },
          },
        },
      },
      elements: {
        line: { tension: 0.1 },
      },
      interaction: {
        intersect: false,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) =>
              balancesHidden
                ? `${context.dataset.label}: ${formatHiddenMoney(mainCurrency)}`
                : `${context.dataset.label}: ${formatMoney(context.parsed.y ?? 0, { currency: mainCurrency })}`,
          },
        },
      },
    }}
  />
</div>

<Portal visible={legendVisible}>
  <Layout title={$translate('analytics.balance.legend')} onBack={() => (legendVisible = false)}>
    <BalanceChartLegend
      accounts={sortedAccounts.slice().reverse()}
      onApply={handleAccountCheckedApply}
      {selectedAccounts}
    />
  </Layout>
</Portal>

<style>
  .chart-container {
    position: relative;
    height: 100%;
    width: 100%;
    padding-top: 10px;
  }
  .legend-button {
    position: absolute;
    top: 1rem;
    left: 1rem;
    z-index: 1;
  }
</style>
