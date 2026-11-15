<script lang="ts">
  import dayjs from 'dayjs';
  import { v4 as uuid } from 'uuid';
  import Button from '@ya-erm/svelte-ui/Button';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import Input from '@ya-erm/svelte-ui/Input';
  import InputLabel from '@ya-erm/svelte-ui/InputLabel';
  import { accountsStore } from '#lib/data/accounts.js';
  import { categoriesStore, SYSTEM_CATEGORY_DEBT_IN, SYSTEM_CATEGORY_DEBT_OUT } from '#lib/data/categories.js';
  import type { Messages } from '#lib/translate/messages.js';
  import { debtEntriesStore, debtRecordsService } from '#lib/data/debts.js';
  import { memberSettingsStore } from '#lib/data/members.js';
  import { operationsService, operationsStore } from '#lib/data/operations.js';
  import type { DebtContact, DebtRecord, Transaction } from '#lib/data/interfaces.js';
  import { translate } from '#lib/translate/index.js';
  import SubScreen from '#lib/ui/layout/SubScreen.svelte';
  import { formatDebtMoney as formatMoney } from './formatMoney';
  import { contactBalances, currencyPrecision, fromMinor, isValidMoney, toMinor } from './calculations';
  import ContactPicker from './ContactPicker.svelte';
  import DeleteDebtModal from './DeleteDebtModal.svelte';
  import { debtDirectionMessage, repaymentDirectionMessage } from './grammar';
  import AccountSelector from '../../routes/transactions/form/AccountSelector.svelte';
  import TransactionListItem from '../../routes/transactions/TransactionListItem.svelte';
  import DebtOperationPicker from './DebtOperationPicker.svelte';

  export let contact: DebtContact | null = null;
  export let repayment = false;
  export let initialCurrency = '';
  export let record: DebtRecord | null = null;
  export let onClose: () => void;
  repayment = record?.kind === 'repayment' || repayment;
  let entryType = repayment ? 'repayment' : 'debt';
  let currency = record?.currency ?? (initialCurrency || $memberSettingsStore?.currency || 'EUR');
  $: currency = currency.trim().toUpperCase();
  let amount = record
    ? String(Math.abs(record.amount))
    : repayment && contact
      ? String(Math.abs(contactBalances($debtEntriesStore, contact.id)[currency] ?? 0))
      : '';
  let direction = record
    ? record.amount * (repayment ? -1 : 1) > 0
      ? 'receivable'
      : 'payable'
    : contact && (contactBalances($debtEntriesStore, contact.id)[currency] ?? 0) < 0
      ? 'payable'
      : 'receivable';
  let method = record ? 'manual' : repayment ? 'new' : 'manual';
  let date = record ? dayjs(record.date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
  let comment = record?.comment ?? '';
  const dueDate = record?.dueDate ?? '';
  let accountId = '';
  let selectingAccount = false;
  let selectingOperation = false;
  let categoryId = '';
  let operationId = '';
  let picking = false;
  let error = '';
  let saving = false;
  let deleteOpened = false;
  const savedId = record?.id ?? uuid();
  const newOperationId = uuid();
  $: balance = contact
    ? (contactBalances(
        $debtEntriesStore.filter((entry) => entry.id !== record?.id),
        contact.id,
      )[currency] ?? 0)
    : 0;
  $: accounts = $accountsStore.filter((account) => !account.archived && account.currency === currency);
  $: if (!accounts.some((account) => account.id === accountId)) accountId = accounts[0]?.id ?? '';
  $: paymentDirection = repayment
    ? direction === 'receivable'
      ? 'IN'
      : 'OUT'
    : direction === 'receivable'
      ? 'OUT'
      : 'IN';
  $: candidates = $operationsStore.filter(
    (operation) =>
      !operation.debt &&
      !operation.linkedTransactionId &&
      !operation.repeatingId &&
      !operation.category.system &&
      operation.account.currency === currency &&
      operation.category.type === paymentDirection &&
      new Date(operation.date) <= new Date(),
  );
  $: defaultCategory = paymentDirection === 'IN' ? SYSTEM_CATEGORY_DEBT_IN : SYSTEM_CATEGORY_DEBT_OUT;
  $: categories = $categoriesStore.filter((category) => category.type === paymentDirection && !category.deleted);
  $: if (categoryId && !categories.some((category) => category.id === categoryId)) categoryId = '';
  $: selectedOperation = candidates.find((operation) => operation.id === operationId);
  $: repayableBalance = direction === 'receivable' ? Math.max(0, balance) : Math.max(0, -balance);
  $: remaining = fromMinor(toMinor(repayableBalance, currency) - toMinor(Number(amount) || 0, currency), currency);

  function changeEntryType() {
    repayment = entryType === 'repayment';
    if (!record) {
      direction = balance < 0 ? 'payable' : 'receivable';
      amount = repayment ? String(Math.abs(balance)) : '';
      method = repayment ? 'new' : 'manual';
    }
    operationId = '';
    error = '';
  }

  async function save() {
    if (saving) return;
    error = '';
    const value = Number(amount);
    if (!/^[A-Z]{3}$/.test(currency)) {
      error = $translate('debts.invalid');
      return;
    }
    if (!contact) {
      error = $translate('debts.contact_required');
      return;
    }
    if (!isValidMoney(value, currency) || value <= 0) {
      error = $translate('debts.invalid');
      return;
    }
    if (repayment && repayableBalance === 0) {
      error = $translate('debts.no_debt_in_direction');
      return;
    }
    if (repayment && toMinor(value, currency) > toMinor(repayableBalance, currency)) {
      error = $translate('debts.repayment_too_much');
      return;
    }
    if (method === 'existing' && !selectedOperation) {
      error = $translate('debts.payment_required');
      return;
    }
    if (
      method === 'existing' &&
      selectedOperation &&
      toMinor(value, currency) > toMinor(selectedOperation.amount, currency)
    ) {
      error = $translate('debts.too_much');
      return;
    }
    if (method === 'new' && !accountId) {
      error = $translate('debts.no_account');
      return;
    }
    saving = true;
    try {
      const recordedAt =
        record && dayjs(record.date).format('YYYY-MM-DD') === date
          ? record.date
          : date === dayjs().format('YYYY-MM-DD')
            ? dayjs().toISOString()
            : dayjs(date).hour(12).toISOString();
      if (method === 'manual') {
        await debtRecordsService.save({
          id: savedId,
          contactId: contact.id,
          amount: value * (direction === 'receivable' ? 1 : -1) * (repayment ? -1 : 1),
          kind: repayment ? 'repayment' : 'debt',
          currency,
          date: recordedAt,
          comment: comment.trim(),
          ...(dueDate ? { dueDate } : {}),
        });
      } else {
        const debt = {
          kind: repayment ? ('repayment' as const) : ('loan' as const),
          shares: [{ contactId: contact.id, amount: value }],
          ...(dueDate ? { dueDate } : {}),
        };
        const operation: Transaction =
          method === 'existing' && selectedOperation
            ? { ...operationsService.getById(selectedOperation.id)!, debt }
            : {
                id: newOperationId,
                accountId,
                categoryId: categoryId || defaultCategory.id,
                amount: value,
                date: recordedAt,
                comment: comment.trim(),
                debt,
              };
        await operationsService.save(operation);
      }
      onClose();
    } catch {
      error = $translate('debts.save_failed');
    } finally {
      saving = false;
    }
  }
</script>

<SubScreen
  visible
  title={$translate(record ? 'debts.edit_entry' : 'debts.add_entry')}
  onBack={onClose}
  testId="DebtPaymentForm"
>
  <form class="payment-form" on:submit|preventDefault={save}>
    <div class="person">
      <InputLabel text={$translate('debts.who')} />
      <button
        type="button"
        class="person-row"
        on:click={() => (picking = true)}
        disabled={!!record}
        data-testId="PaymentContact"
      >
        <span class="avatar" aria-hidden="true"
          >{contact
            ? contact.name
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part.charAt(0))
                .join('')
                .toLocaleUpperCase()
            : '+'}</span
        >
        <span class="person-name">{contact?.name ?? $translate('debts.select_contact')}</span>
        {#if !record}<span class="chevron" aria-hidden="true"><Icon name="mdi:chevron-right" size={1.25} /></span>{/if}
      </button>
    </div>
    <label class="field"
      ><InputLabel text={$translate('debts.entry_type')} /><select
        bind:value={entryType}
        on:change={changeEntryType}
        data-testId="DebtEntryType"
        ><option value="debt">{$translate('debts.debt')}</option><option value="repayment"
          >{$translate('debts.repayment')}</option
        ></select
      ></label
    >
    <label class="field"
      ><InputLabel text={$translate('debts.direction')} /><select
        bind:value={direction}
        data-testId="DebtDirection"
        on:change={() => {
          operationId = '';
          error = '';
        }}
        ><option value="receivable"
          >{$translate(repayment ? repaymentDirectionMessage(contact) : debtDirectionMessage(contact, 1))}</option
        ><option value="payable">{$translate(repayment ? 'debts.i_returned' : 'debts.payable')}</option></select
      ></label
    >
    <div class="two-fields">
      <Input
        label={$translate('transactions.amount')}
        name="debt-amount"
        bind:value={amount}
        type="number"
        inputmode="decimal"
        min={10 ** -currencyPrecision(currency)}
        step={10 ** -currencyPrecision(currency)}
        required
      />
      <Input
        label={$translate('accounts.currency')}
        name="currency"
        bind:value={currency}
        readonly={!!record}
        onChange={(value) => {
          currency = value.trim().toUpperCase();
          if (repayment && !record && contact) {
            const selectedBalance = contactBalances($debtEntriesStore, contact.id)[currency] ?? 0;
            direction = selectedBalance < 0 ? 'payable' : 'receivable';
            amount = String(Math.abs(selectedBalance));
            operationId = '';
          }
        }}
        maxlength={3}
        required
      />
    </div>
    {#if !record}
      <label class="field"
        ><InputLabel text={$translate('debts.how')} /><select bind:value={method} data-testId="DebtPaymentMethod">
          <option value="manual">{$translate('debts.without_operation')}</option>
          <option value="new">{$translate(repayment ? 'debts.new_payment' : 'debts.with_account')}</option>
          <option value="existing">{$translate('debts.existing_payment')}</option>
        </select></label
      >
    {/if}
    {#if method === 'new'}
      <AccountSelector
        bind:accountId
        bind:selecting={selectingAccount}
        accountFilter={(account) => !account.archived && account.currency === currency}
        testId="DebtAccount"
      />
      {#if !accounts.length}<p class="caption">{$translate('debts.no_account')}</p>{/if}
      <label class="field">
        <InputLabel text={$translate('transactions.category')} />
        <select bind:value={categoryId} data-testId="DebtPaymentCategory">
          <option value="">{$translate(defaultCategory.name as Messages)}</option>
          {#each categories as category (category.id)}<option value={category.id}>{category.name}</option>{/each}
        </select>
      </label>
    {:else if method === 'existing'}
      <div class="field">
        <InputLabel text={$translate('debts.payment')} />
        {#if selectedOperation}<ul class="selected-operation" data-testId="SelectedDebtPayment">
            <TransactionListItem transaction={selectedOperation} onClick={() => (selectingOperation = true)} />
          </ul>
        {:else}<button
            type="button"
            class="select-operation"
            data-testId="ExistingDebtPayment"
            on:click={() => (selectingOperation = true)}
          >
            <span>{$translate('debts.select_payment')}</span><Icon name="mdi:chevron-right" />
          </button>{/if}
      </div>
    {/if}
    {#if method !== 'existing'}
      <Input label={$translate('transactions.date')} name="date" bind:value={date} type="date" required />
      <Input label={$translate('transactions.comment')} name="comment" bind:value={comment} maxlength={500} />
    {/if}
    {#if method !== 'manual' || !repayment}<p class="caption">
        {$translate(method === 'manual' ? 'debts.record_hint' : 'debts.account_hint')}
      </p>{/if}
    {#if repayment}<div class="remaining" aria-live="polite">
        <span>{$translate('debts.remaining')}</span><strong>{formatMoney(remaining, { currency })}</strong>
      </div>{/if}
    {#if error}<p class="error" role="alert">{error}</p>{/if}
    <Button type="submit" disabled={saving} text={$translate('common.save')} testId="SaveDebtPayment" />
    {#if record}<Button
        color="danger"
        appearance="transparent"
        disabled={saving}
        text={$translate('debts.remove_record')}
        testId="DeleteDebtRecordButton"
        onClick={() => (deleteOpened = true)}
      />{/if}
  </form>
</SubScreen>
{#if selectingOperation}<DebtOperationPicker
    operations={candidates}
    selectedId={operationId}
    onClose={() => (selectingOperation = false)}
    onSelect={(operation) => {
      operationId = operation.id;
      selectingOperation = false;
      error = '';
    }}
  />{/if}
<DeleteDebtModal
  bind:opened={deleteOpened}
  onDelete={async () => {
    if (!record) return;
    await debtRecordsService.save({ ...record, deleted: true });
    onClose();
  }}
/>
{#if picking}<ContactPicker
    onClose={() => (picking = false)}
    onSelect={(value) => {
      contact = value;
      if (repayment) {
        const selectedBalance = contactBalances($debtEntriesStore, value.id)[currency] ?? 0;
        direction = selectedBalance < 0 ? 'payable' : 'receivable';
        amount = String(Math.abs(selectedBalance));
      }
      picking = false;
    }}
  />{/if}

<style>
  .selected-operation {
    list-style: none;
    margin: 0;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 1rem;
  }
  .select-operation {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 1rem;
    font: inherit;
    color: var(--active-color);
    background: var(--header-background-color);
    cursor: pointer;
  }
  .person-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    text-align: left;
    font: inherit;
    color: var(--primary-text-color);
    background: var(--header-background-color);
    border: 0;
    border-radius: 1rem;
    cursor: pointer;
  }
  .person-row:disabled {
    cursor: default;
  }
  .avatar {
    display: grid;
    place-items: center;
    width: 2.5rem;
    height: 2.5rem;
    flex-shrink: 0;
    border-radius: 50%;
    background: var(--background-color);
    color: var(--secondary-text-color);
  }
  .person-name {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .chevron {
    color: var(--secondary-text-color);
  }
  .payment-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  .field,
  .person {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .caption {
    color: var(--secondary-text-color);
    font-size: 0.9rem;
  }
  .caption {
    margin: 0;
  }
  select {
    min-width: 0;
    width: 100%;
    font: inherit;
    color: var(--primary-text-color);
    background: var(--header-background-color);
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
  }
  .two-fields {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    gap: 1rem;
  }
  .remaining {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }
  .remaining strong {
    font-weight: 500;
  }
  .error {
    color: var(--red-color);
    margin: 0;
  }
</style>
