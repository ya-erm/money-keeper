<script lang="ts">
  import { accountsStore, currencyRatesStore, memberSettingsStore, operationsStore } from '$lib/data';
  import { translate } from '$lib/translate';
  import Icon from '$lib/ui/Icon.svelte';
  import InputLabel from '$lib/ui/InputLabel.svelte';
  import Layout from '$lib/ui/Layout.svelte';
  import Portal from '$lib/ui/Portal.svelte';
  import { calculateBalance, findCurrencyRate, groupBySelector } from '$lib/utils';

  import AccountList from '../../accounts/list/AccountList.svelte';
  import AccountListItem from '../../accounts/list/AccountListItem.svelte';

  export let name = 'accountId';
  export let testId: string = 'AccountSelect';
  export let label: string = $translate('transactions.account');
  export let accountId: string | null | undefined;
  export let selecting: boolean;

  $: accounts = $accountsStore;
  $: currencyRates = $currencyRatesStore;
  $: settings = $memberSettingsStore;

  $: account = accounts.find(({ id }) => id === accountId);
  $: operationsByAccount = groupBySelector($operationsStore, (t) => t.account.id);

  const openPortal = () => {
    selecting = true;
  };

  const selectAccount = ({ id }: { id: string }) => {
    accountId = id;
    selecting = false;
  };
</script>

<label for={`account-list-item ${accountId}`} class="flex-col gap-0.5" data-testId={testId}>
  <InputLabel text={label} />
  <input {name} value={accountId} class="hidden" readonly required />

  {#if account}
    <AccountListItem
      {account}
      onClick={openPortal}
      currencyRate={findCurrencyRate(currencyRates, settings?.currency, account.currency)}
      balance={calculateBalance(operationsByAccount[account.id] ?? [])}
    >
      <Icon slot="end" name="mdi:chevron-right" />
    </AccountListItem>
  {:else}
    <button class="select-account-button flex gap-0.5 items-center" type="button" on:click={openPortal}>
      <div class="account-icon">
        <Icon name={'material-symbols:question-mark'} padding={0.5} />
      </div>
      <span class="flex-grow text-left">{$translate('transactions.select_account')}</span>
      <Icon name="mdi:chevron-right" />
    </button>
  {/if}
</label>

<Portal visible={selecting} testId={`${testId}.Portal`}>
  <Layout
    header={{
      backButton: {
        onClick: () => (selecting = false),
      },
      leftButton: null,
      rightButton: null,
      title: $translate('transactions.select_account'),
    }}
  >
    <AccountList {accounts} onClick={selectAccount} />
  </Layout>
</Portal>

<style>
  .select-account-button {
    padding: 0.5rem;
    font-size: 1rem;
    border-radius: 1rem;
    background-color: var(--header-background-color);
    color: var(--primary-text-color);
    cursor: pointer;
    border: 1px solid var(--border-color);
    width: 100%;
    transition: box-shadow 0.2s ease-in-out;
  }
  @media (hover: hover) {
    .select-account-button:hover {
      box-shadow: 0.25rem 0.25rem 0.5rem 0 rgba(0, 0, 0, 0.1);
      opacity: 0.9;
    }
  }
  .account-icon {
    border-radius: 100%;
    background-color: var(--background-color);
  }
</style>
