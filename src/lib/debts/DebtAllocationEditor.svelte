<script lang="ts">
  import Button from '@ya-erm/svelte-ui/Button';
  import Input from '@ya-erm/svelte-ui/Input';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import { debtContactsStore } from '#lib/data/debtContacts.js';
  import type { TransactionDebt } from '#lib/data/interfaces.js';
  import { translate } from '#lib/translate/index.js';
  import { formatDebtMoney as formatMoney } from './formatMoney';
  import { automaticPersonalAmount, currencyPrecision, fromMinor, toMinor } from './calculations';
  import ContactPicker from './ContactPicker.svelte';
  import DebtCurrencyModal from './DebtCurrencyModal.svelte';

  export let debt: TransactionDebt | undefined = undefined;
  export let amount: number;
  export let currency: string;
  export let direction: string;
  export let anotherCurrency: string | null = null;
  export let anotherCurrencyAmount = 0;
  export let onChange: (debt: TransactionDebt | undefined) => void = () => {};
  let picking = false;
  let currencyContactId: string | null = null;
  let initialCurrency = currency;
  $: if (!initialCurrency && debt && currency) initialCurrency = currency;
  $: changedCurrency = initialCurrency && currency !== initialCurrency;
  $: shares = debt?.shares ?? [];
  $: mixedCurrencies = shares.some((share) => (share.currency ?? currency) !== currency);
  $: automaticAmount = automaticPersonalAmount(
    { amount: amount || 0, debt, anotherCurrency, anotherCurrencyAmount },
    currency,
  );
  $: ownAmount = debt?.personalAmount ?? automaticAmount;
  $: commonCurrency = shares[0]?.currency ?? currency;
  $: equalAmount =
    commonCurrency === currency ? amount : commonCurrency === anotherCurrency ? anotherCurrencyAmount : null;
  $: canSplitEqually =
    shares.every((share) => (share.currency ?? currency) === commonCurrency) && equalAmount !== null && equalAmount > 0;
  $: currencyShare = shares.find((share) => share.contactId === currencyContactId);
  function removeShare(index: number) {
    if (!debt) return;
    const remaining = shares.filter((_, i) => i !== index);
    debt = remaining.length ? { ...debt, shares: remaining } : undefined;
    clearManualIfSameCurrency();
    onChange(debt);
  }
  function changeAmount(index: number, value: string) {
    if (debt)
      debt = { ...debt, shares: shares.map((share, i) => (i === index ? { ...share, amount: Number(value) } : share)) };
  }
  function clearManualIfSameCurrency() {
    if (debt && debt.shares.every((share) => (share.currency ?? currency) === currency)) {
      resetPersonalAmount();
    }
  }
  function resetPersonalAmount() {
    if (!debt) return;
    debt = { ...debt };
    delete debt.personalAmount;
  }
  function changeCurrency(contactId: string, nextCurrency: string) {
    if (!debt) return;
    debt = {
      ...debt,
      shares: shares.map((share) => (share.contactId === contactId ? { ...share, currency: nextCurrency } : share)),
    };
    clearManualIfSameCurrency();
  }
  function equal() {
    if (!debt || !shares.length || !canSplitEqually || equalAmount === null) return;
    const each = Math.floor(toMinor(equalAmount, commonCurrency) / (shares.length + 1));
    debt = { ...debt, shares: shares.map((share) => ({ ...share, amount: fromMinor(each, commonCurrency) })) };
    resetPersonalAmount();
  }
</script>

<section class="allocation" data-testId="DebtAllocationEditor">
  {#if debt}
    {#if changedCurrency}<p class="hint">{$translate('debts.currency_changed')}</p>{/if}
    {#each shares as share, index (share.contactId)}
      {@const contactName = $debtContactsStore.find((contact) => contact.id === share.contactId)?.name ?? '…'}
      {@const shareCurrency = share.currency ?? currency}
      <div class="share-row" data-testId="DebtShare" data-contact={share.contactId}>
        <span class="contact-person"
          ><span class="avatar" aria-hidden="true"
            >{contactName
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part.charAt(0))
              .join('')
              .toLocaleUpperCase()}</span
          ><span class="contact-name">{contactName}</span></span
        >
        <Input
          type="number"
          inputmode="decimal"
          name={`debt-share-${share.contactId}`}
          value={String(share.amount || '')}
          onChange={(value) => changeAmount(index, value)}
          aria-label={$translate('debts.share_amount')}
          required
          min={10 ** -currencyPrecision(shareCurrency)}
          step={10 ** -currencyPrecision(shareCurrency)}
          ><button
            slot="end"
            type="button"
            class="currency-button"
            data-testId="DebtShareCurrency"
            aria-label={`${$translate('debts.currency')}: ${shareCurrency}`}
            on:click={() => (currencyContactId = share.contactId)}>{shareCurrency}</button
          ></Input
        >
        <Button
          appearance="link"
          color="danger"
          onClick={() => removeShare(index)}
          aria-label={$translate('debts.remove_person')}><Icon name="mdi:close" size={1.1} /></Button
        >
      </div>
    {/each}
  {/if}
  <div class="actions">
    <Button
      appearance="link"
      onClick={() => (picking = true)}
      text={$translate('debts.add_person')}
      testId="AddDebtParticipant"
    />
    {#if direction === 'OUT' && shares.length && canSplitEqually}<Button
        appearance="link"
        onClick={equal}
        text={$translate('debts.equal')}
      />{/if}
  </div>
  {#if debt}
    {#if mixedCurrencies && shares.length}
      <div class="flex-col gap-0.5">
        <Input
          label={$translate(direction === 'OUT' ? 'debts.own_share' : 'debts.personal_income')}
          name="debt-personal-amount"
          testId="PersonalDebtAmount"
          type="number"
          inputmode="decimal"
          value={ownAmount === null || !Number.isFinite(ownAmount) ? '' : String(ownAmount)}
          onChange={(value) => {
            if (debt) debt = { ...debt, personalAmount: value === '' ? NaN : Number(value) };
          }}
          endText={currency}
          min={0}
          max={amount}
          step={10 ** -currencyPrecision(currency)}
          required
        />
        {#if debt.personalAmount !== undefined && automaticAmount !== null}<Button
            appearance="link"
            onClick={resetPersonalAmount}
            text={$translate('debts.calculate_automatically')}
            testId="ResetPersonalDebtAmount"
          />{/if}
      </div>
    {:else if direction === 'OUT' && shares.length && ownAmount !== null && ownAmount > 0}<div
        class="own-share"
        aria-live="polite"
      >
        <span>{$translate('debts.own_share')}</span><strong data-testId="OwnShare"
          >{formatMoney(ownAmount, { currency })}</strong
        >
      </div>{/if}
    {#if ownAmount !== null && ownAmount < 0}<p class="invalid" role="alert">{$translate('debts.too_much')}</p>{/if}
  {/if}
</section>

{#if picking}<ContactPicker
    excludeIds={shares.map((share) => share.contactId)}
    onClose={() => (picking = false)}
    onSelect={(contact) => {
      debt = { ...debt, kind: 'payment', shares: [...shares, { contactId: contact.id, amount: 0 }] };
      onChange(debt);
      picking = false;
    }}
  />{/if}

{#if currencyShare}<DebtCurrencyModal
    currency={currencyShare.currency ?? currency}
    suggestions={[currency, ...(anotherCurrency ? [anotherCurrency] : [])]}
    onSelect={(value) => changeCurrency(currencyShare.contactId, value)}
    onClose={() => (currencyContactId = null)}
  />{/if}

<style>
  .allocation {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--header-background-color);
    border: 1px solid var(--border-color);
    border-radius: 1rem;
  }
  .hint {
    color: var(--secondary-text-color);
    font-size: 0.9rem;
  }
  .hint {
    margin: 0;
  }
  .share-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr) 2rem;
    gap: 0.5rem;
    align-items: center;
  }
  .currency-button {
    align-self: stretch;
    padding: 0 0.65rem;
    border: 0;
    background: transparent;
    font: inherit;
    color: var(--active-color);
    cursor: pointer;
  }
  .contact-name {
    overflow-wrap: anywhere;
  }
  .contact-person {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }
  .avatar {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: var(--background-color);
    color: var(--secondary-text-color);
    font-size: 0.85rem;
  }
  .actions {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .own-share {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .own-share strong {
    font-weight: 500;
    font-size: 1.2rem;
  }
  .invalid {
    color: var(--red-color);
    margin: 0;
  }
</style>
