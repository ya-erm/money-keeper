<script lang="ts">
  import { goto } from '$app/navigation';
  import Button from '@ya-erm/svelte-ui/Button';
  import { debtEntriesStore, debtRecordsService } from '#lib/data/debts.js';
  import { debtContactsStore } from '#lib/data/debtContacts.js';
  import { settingsStore } from '#lib/data/settings.js';
  import type { DebtRecord } from '#lib/data/interfaces.js';
  import { route } from '#lib/routes.js';
  import { translate } from '#lib/translate/index.js';
  import HiddenMoney from '#lib/ui/HiddenMoney.svelte';
  import Layout from '#lib/ui/layout/Layout.svelte';
  import ContactEditButton from './ContactEditButton.svelte';
  import { formatDebtMoney as formatMoney } from './formatMoney';
  import { contactBalances } from './calculations';
  import ContactEditor from './ContactEditor.svelte';
  import DebtPaymentForm from './DebtPaymentForm.svelte';
  import { debtDirectionMessage } from './grammar';
  import DebtHistory from './DebtHistory.svelte';

  export let contactId: string;
  export let onClose: () => void;
  let editing = false;
  let payment: { repayment: boolean; currency: string; record?: DebtRecord } | null = null;
  let limit = 30;
  $: contact = $debtContactsStore.find((contact) => contact.id === contactId);
  $: entries = $debtEntriesStore.filter((entry) => entry.contactId === contactId);
  $: balances = contactBalances(entries, contactId);
  $: hidden = $settingsStore.hideBalances ?? false;
  const showOperation = (operationId: string) => {
    void goto(`${route('transactions')}?operation-id=${encodeURIComponent(operationId)}`);
  };
</script>

{#if contact}
  <div data-testId="ContactDetails">
    <Layout
      title={contact.name}
      onBack={onClose}
      rightSlot={ContactEditButton}
      rightSlotProps={{ onClick: () => (editing = true) }}
    >
      <div class="details">
        {#if contact.note}<p class="caption">{contact.note}</p>{/if}
        {#if Object.values(balances).every((value) => !value)}<p class="caption" class:settled={entries.length > 0}>
            {$translate(entries.length ? 'debts.settled' : 'debts.no_entries')}
          </p>
          <Button
            text={$translate('debts.add_entry')}
            onClick={() => (payment = { repayment: false, currency: Object.keys(balances)[0] ?? '' })}
          />{/if}
        {#each Object.entries(balances).filter(([, amount]) => amount !== 0) as [currency, amount] (currency)}
          <div class="balance-row">
            <div>
              <span class="caption">{$translate(debtDirectionMessage(contact, amount))}</span>
              <div class="balance" class:receivable={amount > 0} class:payable={amount < 0}>
                {#if hidden}<HiddenMoney {currency} />{:else}{formatMoney(Math.abs(amount), { currency })}{/if}
              </div>
            </div>
            <Button
              onClick={() => (payment = { repayment: true, currency })}
              text={$translate('debts.add_entry')}
              testId="RecordRepayment"
            />
          </div>
        {/each}
        <h2>{$translate('debts.history')}</h2>
        <DebtHistory
          entries={entries.slice(0, limit)}
          {hidden}
          onOpenOperation={showOperation}
          onEditRecord={(id) => {
            const record = debtRecordsService.getById(id);
            if (record) payment = { repayment: false, currency: record.currency, record };
          }}
        />
        {#if entries.length > limit}<Button
            appearance="link"
            onClick={() => (limit += 30)}
            text={$translate('common.show_more')}
          />{/if}
      </div>
    </Layout>
  </div>
  {#if editing}<ContactEditor {contact} onClose={() => (editing = false)} />{/if}
  {#if payment}<DebtPaymentForm
      {contact}
      repayment={payment.repayment}
      initialCurrency={payment.currency}
      record={payment.record ?? null}
      onClose={() => (payment = null)}
    />{/if}
{/if}

<style>
  .details {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  .caption {
    color: var(--secondary-text-color);
    font-size: 0.9rem;
    overflow-wrap: anywhere;
    margin: 0;
  }
  .balance-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    padding: 1rem;
    background: var(--header-background-color);
    border-radius: 1rem;
  }
  .balance {
    font-size: 1.5rem;
    font-variant-numeric: tabular-nums;
  }
  .receivable,
  .settled {
    color: var(--green-color);
  }
  .payable {
    color: var(--red-color);
  }
  h2 {
    font-size: 1.1rem;
    margin: 0.5rem 0 0;
  }
</style>
