<script lang="ts">
  import Button from '@ya-erm/svelte-ui/Button';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import SearchInput from '#lib/ui/SearchInput.svelte';
  import { debtContactsStore } from '#lib/data/debtContacts.js';
  import { debtEntriesStore } from '#lib/data/debts.js';
  import { settingsStore } from '#lib/data/settings.js';
  import HiddenMoney from '#lib/ui/HiddenMoney.svelte';
  import { formatDebtMoney } from './formatMoney';
  import type { DebtContact } from '#lib/data/interfaces.js';
  import { translate } from '#lib/translate/index.js';
  import SubScreen from '#lib/ui/layout/SubScreen.svelte';
  import { contactBalances, recentContacts } from './calculations';
  import ContactEditor from './ContactEditor.svelte';
  import { debtDirectionMessage } from './grammar';

  export let onSelect: (contact: DebtContact) => void;
  export let onClose: () => void;
  export let excludeIds: string[] = [];
  let query = '';
  let limit = 30;
  let creating = false;
  $: available = $debtContactsStore.filter((contact) => !excludeIds.includes(contact.id));
  $: results = recentContacts(available, $debtEntriesStore, query, limit);
  $: rows = results.map((contact) => ({
    contact,
    balances: Object.entries(contactBalances($debtEntriesStore, contact.id)).filter(([, amount]) => amount !== 0),
  }));
  $: hidden = $settingsStore.hideBalances ?? false;
</script>

<SubScreen visible title={$translate('debts.select_contact')} onBack={onClose} testId="ContactPicker">
  <div class="flex-col gap-1 p-1">
    <SearchInput bind:value={query} name="contact-search" />
    <ul class="contact-list">
      {#each rows as { contact, balances } (contact.id)}
        <li>
          <button
            type="button"
            class="contact-row"
            on:click={() => onSelect(contact)}
            data-testId="PickContact"
            data-id={contact.id}
          >
            <span class="avatar" aria-hidden="true"
              >{contact.name
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part.charAt(0))
                .join('')
                .toLocaleUpperCase()}</span
            >
            <span class="contact-text"
              ><span>{contact.name}</span>{#if contact.note}<span class="contact-note">{contact.note}</span>{/if}</span
            >
            <span class="contact-status" data-testId="PickerDebtStatus">
              {#each balances as [currency, amount] (currency)}
                <span class="currency-status"
                  ><span class="status-label">{$translate(debtDirectionMessage(contact, amount))}</span><span
                    class="status-amount"
                    class:receivable={amount > 0}
                    class:payable={amount < 0}
                    >{#if hidden}<HiddenMoney {currency} size="sm" />{:else}{formatDebtMoney(Math.abs(amount), {
                        currency,
                      })}{/if}</span
                  ></span
                >
              {:else}<span class="status-label">{$translate('debts.no_balance')}</span>{/each}
            </span>
            <span class="chevron" aria-hidden="true"><Icon name="mdi:chevron-right" size={1.25} /></span>
          </button>
        </li>
      {:else}<li class="empty caption">
          {$translate($debtContactsStore.length ? 'common.nothing_found' : 'debts.empty_contacts')}
        </li>{/each}
    </ul>
    {#if results.length === limit}
      <Button appearance="link" onClick={() => (limit += 30)} text={$translate('common.show_more')} />
    {/if}
    <Button onClick={() => (creating = true)} text={$translate('debts.new_contact')} testId="PickerAddContact" />
  </div>
</SubScreen>
{#if creating}<ContactEditor initialName={query.trim()} onClose={() => (creating = false)} onSave={onSelect} />{/if}

<style>
  .caption {
    color: var(--secondary-text-color);
    margin: 0;
  }
  .contact-list {
    padding: 0;
    margin: 0;
    list-style: none;
    border-radius: 1rem;
    background: var(--header-background-color);
    overflow: hidden;
  }
  .contact-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.875rem 1rem;
    font: inherit;
    color: var(--primary-text-color);
    text-align: left;
    border: 0;
    background: transparent;
    cursor: pointer;
  }
  li + li .contact-row {
    border-top: 1px solid var(--border-color);
  }
  .contact-row:hover,
  .contact-row:focus-visible {
    background: var(--hover-background-color);
  }
  .avatar {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: var(--background-color);
    color: var(--secondary-text-color);
  }
  .contact-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
    overflow-wrap: anywhere;
  }
  .contact-note {
    color: var(--secondary-text-color);
    font-size: 0.85rem;
  }
  .chevron {
    color: var(--secondary-text-color);
  }
  .contact-status {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0;
    max-width: 50%;
    gap: 0.4rem;
    text-align: right;
  }
  .currency-status {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.1rem;
  }
  .status-label {
    color: var(--secondary-text-color);
    font-size: 0.75rem;
  }
  .status-amount {
    font-size: 0.95rem;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }
  .receivable {
    color: var(--green-color);
  }
  .payable {
    color: var(--red-color);
  }
  .empty {
    padding: 1rem;
  }
</style>
