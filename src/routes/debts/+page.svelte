<script lang="ts">
  import Button from '@ya-erm/svelte-ui/Button';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import SearchInput from '#lib/ui/SearchInput.svelte';
  import { debtContactsStore } from '#lib/data/debtContacts.js';
  import { debtEntriesStore } from '#lib/data/debts.js';
  import { accountsStore } from '#lib/data/accounts.js';
  import { settingsStore } from '#lib/data/settings.js';
  import { localAccountBalancesHidden } from '#lib/accountBalanceVisibility.js';
  import { contactBalances, fromMinor, toMinor } from '#lib/debts/calculations.js';
  import ContactDetails from '#lib/debts/ContactDetails.svelte';
  import DebtPaymentForm from '#lib/debts/DebtPaymentForm.svelte';
  import { debtDirectionMessage } from '#lib/debts/grammar.js';
  import { translate } from '#lib/translate/index.js';
  import Layout from '#lib/ui/layout/Layout.svelte';
  import HiddenMoney from '#lib/ui/HiddenMoney.svelte';
  import { formatDebtMoney as formatMoney } from '#lib/debts/formatMoney.js';
  import { isBalanceHidden } from '#lib/utils/isBalanceHidden.js';
  import DebtHeaderActions from './DebtHeaderActions.svelte';
  import DebtContactsButton from './DebtContactsButton.svelte';
  let filter: 'all' | 'in' | 'out' = 'all';
  let query = '';
  let detailId: string | null = null;
  let creating = false;
  let limit = 20;
  let filtersOpened = false;
  $: people = $debtContactsStore
    .map((contact) => ({
      contact,
      balances: contactBalances($debtEntriesStore, contact.id),
      last: $debtEntriesStore.find((entry) => entry.contactId === contact.id)?.date ?? '',
    }))
    .filter((person) => Object.values(person.balances).some((amount) => amount !== 0))
    .sort((a, b) => b.last.localeCompare(a.last));
  $: visiblePeople = people.filter(
    ({ contact, balances }) =>
      contact.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) &&
      (filter === 'all' || Object.values(balances).some((amount) => (filter === 'in' ? amount > 0 : amount < 0))),
  );
  $: hidden =
    $settingsStore.hideBalances ||
    $debtEntriesStore.some(
      (entry) =>
        entry.accountId &&
        isBalanceHidden(
          null,
          $accountsStore.find((account) => account.id === entry.accountId),
          $localAccountBalancesHidden,
        ),
    );
  $: totals = people.reduce(
    (sums, person) => {
      for (const [currency, amount] of Object.entries(person.balances)) {
        const key = amount > 0 ? 'in' : 'out';
        if (amount) sums[key][currency] = (sums[key][currency] ?? 0) + Math.abs(toMinor(amount, currency));
      }
      return sums;
    },
    { in: {} as Record<string, number>, out: {} as Record<string, number> },
  );
</script>

<Layout
  title={$translate('debts.title')}
  leftSlot={DebtContactsButton}
  rightSlot={DebtHeaderActions}
  rightSlotProps={{ onCreate: () => (creating = true) }}
>
  <div class="debts-page">
    <div class="summary" aria-label={$translate('debts.title')}>
      {#each ['in', 'out'] as side (side)}
        <div class="summary-card">
          <span class="caption">{$translate(side === 'in' ? 'debts.receivable' : 'debts.payable')}</span>
          <div class="summary-values" class:receivable={side === 'in'} class:payable={side === 'out'}>
            {#each Object.entries(totals[side as 'in' | 'out']) as [currency, amount] (currency)}<span
                >{#if hidden}<HiddenMoney {currency} />{:else}{formatMoney(fromMinor(amount, currency), {
                    currency,
                  })}{/if}</span
              >{:else}<span>—</span>{/each}
          </div>
        </div>
      {/each}
    </div>
    {#if people.length}
      <div class="search-row">
        <SearchInput bind:value={query} name="debt-search" />
        <button
          type="button"
          class="filter-button"
          class:active={filter !== 'all'}
          aria-label={$translate('debts.filters')}
          title={$translate('debts.filters')}
          aria-expanded={filtersOpened}
          aria-controls="debt-filters"
          on:click={() => (filtersOpened = !filtersOpened)}
          data-testId="DebtFiltersButton"
        >
          <Icon name="mdi:filter" size={1.3} />
          {#if filter !== 'all'}<span class="filter-dot" aria-hidden="true"></span>{/if}
        </button>
      </div>
      <div
        class="filters"
        id="debt-filters"
        hidden={!filtersOpened}
        role="group"
        aria-label={$translate('debts.filters')}
      >
        <button type="button" aria-pressed={filter === 'all'} on:click={() => (filter = 'all')}
          >{$translate('debts.active')}</button
        ><button type="button" aria-pressed={filter === 'in'} on:click={() => (filter = 'in')}
          >{$translate('debts.receivable')}</button
        ><button type="button" aria-pressed={filter === 'out'} on:click={() => (filter = 'out')}
          >{$translate('debts.payable')}</button
        >
      </div>
      <div class="people-list">
        {#each visiblePeople.slice(0, limit) as person (person.contact.id)}<button
            type="button"
            class="person"
            on:click={() => (detailId = person.contact.id)}
            data-testId="DebtPerson"
            ><span class="avatar" aria-hidden="true">{person.contact.name.charAt(0)}</span><span class="person-name"
              ><span>{person.contact.name}</span>{#if person.contact.note}<span
                  class="person-note"
                  data-testId="DebtPersonNote">{person.contact.note}</span
                >{/if}</span
            ><span class="person-balances"
              >{#each [1, -1] as side (side)}
                {@const amounts = Object.entries(person.balances).filter(([, amount]) => amount * side > 0)}
                {#if amounts.length}<span class:receivable={side > 0} class:payable={side < 0}>
                    <span class="balance-label" data-testId="DebtPersonBalanceDirection"
                      >{$translate(debtDirectionMessage(person.contact, side))}</span
                    >
                    {#each amounts as [currency, amount] (currency)}<span
                        >{#if hidden}<HiddenMoney {currency} size="sm" />{:else}{formatMoney(Math.abs(amount), {
                            currency,
                          })}{/if}</span
                      >{/each}
                  </span>{/if}
              {/each}</span
            ></button
          >{:else}<p class="caption">{$translate('common.nothing_found')}</p>{/each}
      </div>
      {#if visiblePeople.length > limit}<Button
          appearance="link"
          onClick={() => (limit += 20)}
          text={$translate('common.show_more')}
        />{/if}
    {:else}<div class="empty">
        <Icon name="mdi:account-group" size={2.5} />
        <h2>{$translate('debts.empty')}</h2>
        <p>{$translate('debts.empty_hint')}</p>
      </div>{/if}
  </div>
</Layout>
{#if detailId}<ContactDetails contactId={detailId} onClose={() => (detailId = null)} />{/if}
{#if creating}<DebtPaymentForm onClose={() => (creating = false)} />{/if}

<style>
  .debts-page {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  .summary {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 0.75rem;
  }
  .summary-card {
    min-width: 0;
    background: var(--header-background-color);
    border: 1px solid var(--border-color);
    border-radius: 1rem;
    padding: 1rem;
  }
  .caption {
    color: var(--secondary-text-color);
    font-size: 0.9rem;
  }
  .summary-values {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding-top: 0.5rem;
    font-size: 1.3rem;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }
  .receivable {
    color: var(--green-color);
  }
  .payable {
    color: var(--red-color);
  }
  .search-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  .filter-button {
    position: relative;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    background: var(--header-background-color);
    color: var(--secondary-text-color);
    cursor: pointer;
  }
  .filter-button.active {
    color: var(--active-color);
    border-color: var(--active-color);
  }
  .filter-dot {
    position: absolute;
    width: 0.35rem;
    height: 0.35rem;
    border-radius: 50%;
    background: var(--active-color);
    top: 0.35rem;
    right: 0.35rem;
  }
  .filters[hidden] {
    display: none;
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .filters button {
    background: var(--header-background-color);
    color: var(--secondary-text-color);
    padding: 0.65rem 0.8rem;
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    font: inherit;
    cursor: pointer;
  }
  .filters button[aria-pressed='true'] {
    color: var(--active-color);
    border-color: var(--active-color);
  }
  .people-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .person {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    font: inherit;
    color: var(--primary-text-color);
    background: var(--header-background-color);
    padding: 1rem;
    border: 1px solid var(--border-color);
    border-radius: 1rem;
    width: 100%;
    cursor: pointer;
  }
  .avatar {
    display: grid;
    place-items: center;
    width: 2.5rem;
    height: 2.5rem;
    flex-shrink: 0;
    background: var(--background-color);
    border-radius: 50%;
  }
  .person-name {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    flex: 1;
    min-width: 0;
    text-align: left;
    overflow-wrap: anywhere;
  }
  .person-note {
    font-size: 0.85rem;
    color: var(--secondary-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .person-balances {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.3rem;
    font-variant-numeric: tabular-nums;
  }
  .person-balances > span {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
  .balance-label {
    font-size: 0.75rem;
    color: var(--secondary-text-color);
  }
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.75rem;
    color: var(--secondary-text-color);
    padding: 2rem 1rem;
  }
  .empty h2 {
    font-size: 1.15rem;
    font-weight: 500;
    margin: 0;
  }
  .empty p {
    margin: 0;
    max-width: 25rem;
  }
</style>
