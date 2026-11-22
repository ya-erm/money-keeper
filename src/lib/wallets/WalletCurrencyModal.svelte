<script lang="ts">
  import Button from '@ya-erm/svelte-ui/Button';
  import Input from '@ya-erm/svelte-ui/Input';
  import Tags from '@ya-erm/svelte-ui/Tags';
  import { accountsStore, operationsStore } from '#lib/data/index.js';
  import { debtRecordsStore } from '#lib/data/debts.js';
  import { walletTransfersStore } from '#lib/data/wallets.js';
  import { translate } from '#lib/translate/index.js';
  import Modal from '@ya-erm/svelte-ui/Modal';
  export let currency: string;
  export let onSelect: (currency: string) => void;
  export let onClose: () => void;
  let opened = true;
  let value = currency;
  $: recent = [
    ...$operationsStore.map((operation) => ({
      date: operation.date,
      currencies: [
        operation.account.currency,
        operation.anotherCurrency,
        ...(operation.debt?.shares.map((share) => share.currency ?? operation.account.currency) ?? []),
      ],
    })),
    ...$debtRecordsStore.map((record) => ({ date: record.date, currencies: [record.currency] })),
    ...$walletTransfersStore.map((transfer) => ({ date: transfer.date, currencies: [transfer.currency] })),
  ].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  $: currencies = [
    ...new Set(
      [
        currency,
        ...recent.flatMap((item) => item.currencies),
        ...$accountsStore.map((account) => account.currency),
      ].filter((id): id is string => !!id),
    ),
  ].map((id) => ({ id, title: id }));
  function save() {
    onSelect(value.trim().toUpperCase());
    onClose();
  }
</script>

<Modal bind:opened {onClose} header={$translate('accounts.currency')} width={18}>
  <form class="flex-col gap-1" data-testId="WalletCurrencyForm" on:submit|preventDefault|stopPropagation={save}>
    <Input
      name="wallet-currency"
      bind:value
      label={$translate('accounts.currency')}
      required
      minlength={3}
      maxlength={3}
      pattern={'[A-Za-z]{3}'}
    />
    {#if currencies.length}<div
        class="recent-currencies"
        data-testId="RecentWalletCurrencies"
        role="group"
        aria-label={$translate('currency_rates.recent_currencies')}
      >
        <Tags tags={currencies} selected={[value.trim().toUpperCase()]} readOnly onChange={(id) => (value = id)} />
      </div>{/if}
    <div class="grid-col-2 gap-1">
      <Button color="secondary" text={$translate('common.cancel')} onClick={onClose} />
      <Button type="submit" text={$translate('common.save')} />
    </div>
  </form>
</Modal>

<style>
  .recent-currencies {
    width: 100%;
    min-width: 0;
  }
  .recent-currencies :global(.container) {
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: thin;
    padding: 0.125rem 0 0.25rem;
  }
  .recent-currencies :global(.tag) {
    flex-shrink: 0;
  }
</style>
