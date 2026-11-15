<script lang="ts">
  import Button from '@ya-erm/svelte-ui/Button';
  import Input from '@ya-erm/svelte-ui/Input';
  import Tags from '@ya-erm/svelte-ui/Tags';
  import { operationsStore } from '#lib/data/operations.js';
  import { debtRecordsStore } from '#lib/data/debts.js';
  import Modal from '#lib/ui/Modal.svelte';
  import { translate } from '#lib/translate/index.js';

  export let currency: string;
  export let suggestions: string[] = [];
  export let onSelect: (currency: string) => void;
  export let onClose: () => void;
  let opened = true;
  let value = currency;
  $: recent = [
    ...$operationsStore.map((operation) => ({
      date: operation.date,
      currencies: [
        ...(operation.debt?.shares.map((share) => share.currency ?? operation.account.currency) ?? []),
        operation.anotherCurrency,
        operation.account.currency,
      ],
    })),
    ...$debtRecordsStore.map((record) => ({ date: record.date, currencies: [record.currency] })),
  ].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  $: currencies = [
    ...new Set([...suggestions, ...recent.flatMap((item) => item.currencies)].filter((item): item is string => !!item)),
  ]
    .slice(0, 6)
    .map((id) => ({ id, title: id }));
</script>

<Modal bind:opened on:close={onClose} header={$translate('debts.currency')} width={18}>
  <form
    class="flex-col gap-1"
    data-testId="DebtCurrencyForm"
    on:submit|preventDefault|stopPropagation={() => {
      onSelect(value.trim().toUpperCase());
      onClose();
    }}
  >
    <Input
      name="debt-currency"
      bind:value
      label={$translate('accounts.currency')}
      required
      minlength={3}
      maxlength={3}
      pattern={'[A-Za-z]{3}'}
    />
    {#if currencies.length}<div data-testId="RecentDebtCurrencies">
        <Tags tags={currencies} selected={[]} readOnly onChange={(id) => (value = id)} />
      </div>{/if}
    <div class="grid-col-2 gap-1">
      <Button color="secondary" text={$translate('common.cancel')} onClick={onClose} testId="CancelDebtCurrency" />
      <Button type="submit" text={$translate('common.save')} testId="SaveDebtCurrency" />
    </div>
  </form>
</Modal>
