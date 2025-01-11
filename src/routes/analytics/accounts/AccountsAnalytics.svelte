<script lang="ts">
  import Checkbox from '@ya-erm/svelte-ui/Checkbox';

  import {
    accountsStore,
    currencyRatesStore,
    groupingsStore,
    memberSettingsStore,
    membersService,
    operationsStore,
  } from '$lib/data';
  import type { AccountViewModel, Grouping } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import Layout from '$lib/ui/Layout.svelte';
  import Portal from '$lib/ui/Portal.svelte';
  import { calculateBalance, findRate, groupBySelector, pastOperationsPredicate } from '$lib/utils';

  import AccountsTableTable from './AccountsAnalyticsTable.svelte';
  import AddGroupingButton from './groupings/AddGroupingButton.svelte';
  import GroupingList from './groupings/GroupingList.svelte';
  import type { AccountSummary, GroupSummary } from './interfaces';
  import { hideZeroBalanceAccounts } from './store';
  import { countPreviousItems } from './utils';

  const currencyRates = $currencyRatesStore;
  const accounts = $accountsStore;
  const operations = $operationsStore;
  const groupings = $groupingsStore;
  const settings = $memberSettingsStore;

  const mainCurrency = settings?.currency ?? 'USD';

  $: findRateFn = (currency: string) => findRate(currencyRates, mainCurrency, currency);

  $: operationsByAccount = groupBySelector(operations.filter(pastOperationsPredicate()), (t) => t.account.id);

  const colors = ['#fd7f6f', '#7eb0d5', '#b2e061', '#bd7ebe', '#ffb55a', '#ffee65', '#beb9db', '#fdcce5', '#8bd3c7'];

  // Dictionary of account summaries keyed by account.id
  $: accountSummaries = accounts.reduce((acc: Record<string, AccountSummary>, account: AccountViewModel, i) => {
    const balance = calculateBalance(operationsByAccount[account.id] ?? []);
    // skip zero-balance accounts
    if ($hideZeroBalanceAccounts && Number(balance.toFixed(8)) === 0) {
      return acc;
    }
    acc[account.id] = {
      account,
      balance,
      ratedBalance: findRateFn(account.currency) * balance,
      color: account.color ?? colors[i % colors.length],
    };
    return acc;
  }, {});

  $: totalBalance = Object.values(accountSummaries).reduce((sum, item) => sum + item.ratedBalance, 0);

  // Account summaries sorted by percentages
  $: sortedItems = Object.values(accountSummaries)
    .map((item) => ({
      ...item,
      percentages: (100 * item.ratedBalance) / totalBalance,
      group: grouping?.groups?.find((g) => g.accountIds?.includes(item.account.id)),
    }))
    .sort((a, b) => b.percentages - a.percentages);

  let groupingId = settings?.groupingId;
  let grouping: Grouping | null = (groupingId ? groupings.find((g) => g.id === groupingId) : null) ?? null;

  let groupingSelecting = false;

  const handleGroupingSelect = async (value: Grouping | null) => {
    await membersService.updateSettings({ groupingId: value?.id });
    groupingSelecting = false;
    grouping = value;
  };

  // Dictionary of grouped summaries keyed by groupId
  $: groupSummaries = sortedItems.reduce((acc: Record<string, GroupSummary>, item) => {
    const groupId = item.group?.id ?? 'other';
    if (!acc[groupId]) {
      acc[groupId] = {
        groupId,
        group: grouping?.groups?.find((g) => g.id === groupId),
        accountSummaries: [],
        ratedBalance: 0,
        percentages: 0,
      };
    }
    acc[groupId].ratedBalance += item.ratedBalance;
    acc[groupId].percentages += item.percentages;
    acc[groupId].accountSummaries.push(item);
    return acc;
  }, {});

  $: sortedGroupSummaries = Object.values(groupSummaries).sort((a, b) => b.percentages - a.percentages);
</script>

{#if grouping?.groups}
  <div class="flex chart">
    {#each sortedGroupSummaries as { group, groupId, percentages } (groupId)}
      <div class="flex-center" style:width={`${percentages.toFixed(8)}%`} style:background={group?.color}>
        {group?.name ?? $translate('analytics.groupings.groups.other')}
      </div>
    {/each}
  </div>
{/if}

<div class="flex chart">
  {#each sortedGroupSummaries as { groupId, accountSummaries }, i (groupId)}
    {#each accountSummaries as item, j (item.account.id)}
      <div class="flex-center" style:width={`${item.percentages.toFixed(8)}%`} style:background={item.color}>
        {countPreviousItems(sortedGroupSummaries, i) + j + 1}
      </div>
    {/each}
  {/each}
</div>

<AccountsTableTable groups={sortedGroupSummaries} {totalBalance} />

<div class="p-1 flex-col gap-1">
  <div>
    <span>{$translate('analytics.accounts.grouping')}:</span>
    <Button appearance="link" on:click={() => (groupingSelecting = true)}>
      {grouping?.name ?? $translate('analytics.accounts.grouping.not_selected')}
    </Button>
  </div>
  <Checkbox
    checked={$hideZeroBalanceAccounts}
    onChange={(value) => hideZeroBalanceAccounts.set(value)}
    label={$translate('analytics.accounts.hide_zero_balance_accounts')}
  />
</div>

<Portal visible={groupingSelecting}>
  <Layout
    header={{
      backButton: {
        onClick: () => (groupingSelecting = false),
      },
      leftButton: null,
      rightButton: AddGroupingButton,
      title: $translate('analytics.accounts.grouping.select_grouping'),
    }}
  >
    <GroupingList onClick={handleGroupingSelect} withUnselectedValue />
  </Layout>
</Portal>

<style>
  .chart > div {
    overflow: hidden;
    font-size: 0.8rem;
    white-space: nowrap;
  }
</style>
