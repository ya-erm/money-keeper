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
    TimeScale,
  } from 'chart.js';
  import dayjs from 'dayjs';

  import { accountsStore, currencyRatesStore, memberSettingsStore, operationsStore } from '$lib/data';
  import { type Account } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import Icon from '$lib/ui/Icon.svelte';
  import Layout from '$lib/ui/Layout.svelte';
  import Portal from '$lib/ui/Portal.svelte';
  import { findRate } from '$lib/utils';

  import BalanceChartLegend from './BalanceChartLegend.svelte';
  import { getAccountBalanceChartData } from './chartData';

  Chart.register(Title, Tooltip, Legend, LineElement, PointElement, TimeScale, CategoryScale, LinearScale, Filler);

  const currencyRates = $currencyRatesStore;
  const accounts = $accountsStore;
  const operations = $operationsStore;
  const settings = $memberSettingsStore;

  const accountsOrder = settings?.accountsOrder ?? [];

  const getAccountOrder = (account: Account) => {
    const index = accountsOrder.findIndex((id) => id === account.id);
    return index < 0 ? accounts.length : index;
  };

  const sortedAccounts = accounts
    .slice()
    .sort((a, b) => getAccountOrder(a) - getAccountOrder(b))
    .reverse();

  const mainCurrency = settings?.currency ?? 'USD';

  const findRateFn = (currency: string) => findRate(currencyRates, mainCurrency, currency);

  let interval: 12 | 6 | 3 | 1 = 12;

  const changeInterval = () => {
    if (interval === 12) interval = 6;
    else if (interval === 6) interval = 3;
    else if (interval === 3) interval = 1;
    else interval = 12;
  };

  const endDate = dayjs();
  $: startDate = endDate.startOf('month').subtract(interval, 'month');
  const step: 'day' | 'week' | 'month' = 'day';

  let legendVisible = false;

  $: selectedAccounts = accounts.map((account) => account.id);

  const handleAccountCheckedChange = (id: 'all' | string, checked: boolean) => {
    if (id === 'all') {
      selectedAccounts = checked ? accounts.map((account) => account.id) : [];
      return;
    }
    selectedAccounts = checked ? selectedAccounts.concat(id) : selectedAccounts.filter((x) => x !== id);
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
    <Button color="white" bordered on:click={changeInterval}>
      <Icon name="mdi:arrow-expand-horizontal" />
      {interval}M
    </Button>
    <Button color="white" bordered on:click={() => (legendVisible = true)}>
      <Icon name="mdi:format-list-bulleted" />
    </Button>
  </div>
  <Line
    options={{
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          stacked: true,
          position: 'right',
          grid: { z: 1 },
        },
        x: {
          grid: { z: 1 },
          ticks: {
            autoSkip: false,
            callback(_value, index) {
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
      },
    }}
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
  />
</div>

<Portal visible={legendVisible}>
  <Layout
    header={{
      backButton: {
        onClick: () => (legendVisible = false),
      },
      leftButton: null,
      rightButton: null,
      title: $translate('analytics.balance.legend'),
    }}
  >
    <div class="p-1">
      <BalanceChartLegend
        accounts={sortedAccounts.slice().reverse()}
        onChange={handleAccountCheckedChange}
        {selectedAccounts}
      />
    </div>
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
