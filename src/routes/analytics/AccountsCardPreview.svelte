<script lang="ts">
  import { accountsStore, currencyRatesStore, memberSettingsStore, operationsStore, settingsStore } from '$lib/data';
  import { translate } from '$lib/translate';
  import { findRate, formatMoney } from '$lib/utils';

  import { getAccountsPreview } from './accountPreview';

  const fallbackColors = ['#2997d6', '#23a455', '#f3aa18'];
  const otherColor = '#a8adb4';

  $: mainCurrency = $memberSettingsStore?.currency ?? 'USD';
  $: preview = getAccountsPreview($accountsStore, $operationsStore, (currency) =>
    findRate($currencyRatesStore, mainCurrency, currency),
  );
  $: items = [
    ...preview.accounts.map((account, index) => ({
      ...account,
      color: account.color ?? fallbackColors[index],
    })),
    ...(preview.otherPercentage > 0
      ? [
          {
            id: 'other',
            name: $translate('analytics.cards.accounts.other'),
            balance: preview.otherBalance,
            percentage: preview.otherPercentage,
            color: otherColor,
            hidden: preview.otherHidden,
          },
        ]
      : []),
  ];
  $: balancesHidden = $settingsStore.hideBalances ?? false;

  const formatPercent = (value: number) => `${formatMoney(value, { maxPrecision: value >= 10 ? 0 : 1 })}%`;
</script>

<div class="accounts-preview" class:empty={!preview.totalAbsoluteBalance}>
  {#if preview.totalAbsoluteBalance}
    <div class="balance-bar-container" aria-hidden="true">
      <div class="balance-bar">
        {#each items as item (item.id)}
          <span style:width={`${item.percentage}%`} style:background={item.color}></span>
        {/each}
      </div>
    </div>
    <ol class="account-list" aria-label={$translate('analytics.cards.accounts.current')}>
      {#each items as item (item.id)}
        <li>
          <span class="account-name">
            <span class="color" style:background={item.color}></span>
            <span class="name">{item.name}</span>
          </span>
          <span class="amount">
            {#if !balancesHidden && !item.hidden}
              {formatMoney(item.balance, { currency: mainCurrency, maxPrecision: 0 })}
            {/if}
          </span>
          <span class="percentage">{formatPercent(item.percentage)}</span>
        </li>
      {/each}
    </ol>
  {:else}
    <span class="empty-message">{$translate('analytics.cards.accounts.no_balances')}</span>
  {/if}
</div>

<style>
  .accounts-preview {
    display: grid;
    grid-template-rows: 1.5rem minmax(0, 1fr);
    height: 100%;
  }

  .accounts-preview.empty {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .balance-bar-container {
    display: flex;
    align-items: center;
    padding: 0 0.5rem;
  }

  .balance-bar {
    display: flex;
    gap: 0.5rem;
    width: 100%;
    height: 0.5rem;
    overflow: hidden;
    border-radius: 0.25rem;
  }

  .balance-bar span {
    min-width: 1px;
    border-radius: inherit;
  }

  .account-list {
    display: grid;
    grid-auto-rows: 1.5rem;
    border-top: 1px solid var(--border-color);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .account-list li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 6.75rem 2.4rem;
    min-width: 0;
    font-size: 0.75rem;
    line-height: 1.1;
    border-bottom: 1px solid var(--border-color);
  }

  .account-list li:last-child {
    border-bottom: 0;
  }

  .account-name {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    min-width: 0;
    padding: 0 0.5rem;
  }

  .color {
    flex-shrink: 0;
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 50%;
  }

  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .amount,
  .percentage {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 0.4rem;
    white-space: nowrap;
    border-left: 1px solid var(--border-color);
  }

  .percentage,
  .empty-message {
    color: var(--secondary-text-color);
  }

  @media (max-width: 22rem) {
    .account-list li {
      grid-template-columns: minmax(0, 1fr) 5.25rem 2.2rem;
      font-size: 0.68rem;
    }

    .account-name {
      gap: 0.3rem;
      padding-inline: 0.35rem;
    }

    .amount,
    .percentage {
      padding-inline: 0.25rem;
    }
  }
</style>
