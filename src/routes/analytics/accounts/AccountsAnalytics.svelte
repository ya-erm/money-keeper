<script lang="ts">
  import { goto } from '$app/navigation';

  import { accountsStore, currencyRatesStore, memberSettingsStore, operationsStore } from '$lib/data';
  import type { AccountViewModel } from '$lib/data/interfaces';
  import { route } from '$lib/routes';
  import { translate } from '$lib/translate';
  import { formatMoney, groupBySelector } from '$lib/utils';

  import { calculateBalance } from '../../accounts/utils';
  import { findRate } from '../utils/findRate';

  const currencyRates = $currencyRatesStore;
  const accounts = $accountsStore;
  const transactions = $operationsStore;
  const settings = $memberSettingsStore;

  const mainCurrency = settings?.currency ?? 'USD';

  $: findRateFn = (currency: string) => findRate(currencyRates, mainCurrency, currency);

  $: operationsByAccount = groupBySelector($operationsStore, (t) => t.account.id);

  type AccountSummary = {
    account: AccountViewModel;
    balance: number;
    ratedBalance: number;
    color: string;
  };

  const colors = ['#fd7f6f', '#7eb0d5', '#b2e061', '#bd7ebe', '#ffb55a', '#ffee65', '#beb9db', '#fdcce5', '#8bd3c7'];

  $: accountInfo = accounts.reduce((acc: Record<string, AccountSummary>, account: AccountViewModel, i) => {
    const balance = calculateBalance(operationsByAccount[account.id] ?? []);
    acc[account.id] = {
      account,
      balance,
      ratedBalance: findRateFn(account.currency) * balance,
      color: account.color ?? colors[i % colors.length],
    };
    return acc;
  }, {});

  $: totalBalance = Object.values(accountInfo).reduce((sum, item) => sum + item.ratedBalance, 0);

  $: sortedItems = Object.values(accountInfo)
    .map((item) => ({ ...item, percentages: (100 * item.ratedBalance) / totalBalance }))
    .sort((a, b) => b.percentages - a.percentages);

  const onClick = async (item: AccountViewModel) => {
    await goto(`${route('accounts')}?account-card=${item.id}`);
  };
</script>

<div class="flex chart">
  {#each sortedItems as item, i (item.account.id)}
    <div class="flex-center" style:width={`${item.percentages}%`} style:background={item.color}>
      {i + 1}
    </div>
  {/each}
</div>

<table class="p-1">
  <tbody>
    {#each sortedItems as item, i (item.account.id)}
      <tr on:click={() => onClick(item.account)}>
        <td class="number-cell">
          <span class="color-badge" style:background={item.color} />
          <span>{i + 1}.</span>
        </td>
        <td class="name-cell">
          <div class="flex gap-0.25 items-baseline">
            <span class="account-name">{item.account.name}</span>
            <span class="original-currency">{item.account.currency}</span>
          </div>
        </td>
        <td class="rated-balance">
          <div class="flex gap-0.25 items-baseline justify-end">
            <span>{formatMoney(item.ratedBalance, { maxPrecision: 0 })}</span>
            <span class="main-currency">{mainCurrency}</span>
          </div>
        </td>
        <td class="percentages">
          {formatMoney(item.percentages, { maxPrecision: 0 }) + '%'}
        </td>
      </tr>
    {/each}
  </tbody>
  <tfoot>
    <tr>
      <td />
      <td>
        <div class="text-right">{$translate('analytics.accounts.total')}:</div>
      </td>
      <td>
        <div class="flex gap-0.25 items-baseline justify-end">
          <span>{formatMoney(totalBalance, { maxPrecision: 0 })}</span>
          <span class="main-currency">{mainCurrency}</span>
        </div>
      </td>
      <td />
    </tr>
  </tfoot>
</table>

<style>
  .chart > div {
    overflow: hidden;
    font-size: 0.8rem;
  }
  table {
    margin: 0;
    width: 100%;
    padding-left: 1.5rem;
  }
  @media (hover: hover) {
    table tr {
      cursor: pointer;
    }
    table tr:hover {
      color: var(--active-color);
    }
  }
  .number-cell {
    position: relative;
  }
  .color-badge {
    position: absolute;
    left: -12px;
    top: 7.5px;
    width: 8px;
    height: 8px;
    border-radius: 100%;
  }
  .name-cell {
    word-break: break-all;
    padding-right: 1rem;
  }
  .account-name {
    text-align: left;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    overflow: hidden;
    /* white-space: nowrap; */
    /* display: inline-block; */
  }
  .rated-balance {
    word-break: keep-all;
  }
  .original-currency {
    font-size: 0.8rem;
    color: var(--secondary-text-color);
    word-break: keep-all;
  }
  .main-currency {
    font-size: 0.8rem;
  }
  .percentages {
    flex-shrink: 0;
    display: inline-block;
    text-align: right;
    min-width: 40px;
  }
  tfoot tr td {
    border-top: 1px solid var(--border-color);
  }
</style>
