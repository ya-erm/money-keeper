<script lang="ts">
  import Button from '@ya-erm/svelte-ui/Button';
  import Input from '@ya-erm/svelte-ui/Input';
  import Modal from '@ya-erm/svelte-ui/Modal';
  import Tags from '@ya-erm/svelte-ui/Tags';
  import { showErrorToast } from '@ya-erm/svelte-ui/toasts';
  import { accountsStore, membersService, operationsStore } from '#lib/data/index.js';
  import { debtRecordsStore } from '#lib/data/debts.js';
  import { walletTransfersStore } from '#lib/data/wallets.js';
  import { translate } from '#lib/translate/index.js';
  import { participantsService, selectedParticipantStore } from '#lib/data/participants.js';

  export let opened: boolean;
  const participant = $selectedParticipantStore;
  const savedCurrency = participant?.currency ?? membersService.selectedMemberSettings?.currency ?? '';
  let currency = savedCurrency;
  let saving = false;
  $: recent = [
    ...$operationsStore.map((operation) => ({
      date: operation.date,
      currencies: [
        operation.account.currency,
        operation.anotherCurrency,
        ...(operation.debt?.shares.map((share) => share.currency) ?? []),
      ],
    })),
    ...$debtRecordsStore.map((record) => ({ date: record.date, currencies: [record.currency] })),
    ...$walletTransfersStore.map((transfer) => ({ date: transfer.date, currencies: [transfer.currency] })),
  ].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  $: currencies = [
    ...new Set(
      [
        savedCurrency,
        ...recent.flatMap((item) => item.currencies),
        ...$accountsStore.map((account) => account.currency),
      ]
        .filter((value): value is string => !!value)
        .map((value) => value.trim().toUpperCase())
        .filter(Boolean),
    ),
  ].map((id) => ({ id, title: id }));
  async function save() {
    if (saving) return;
    saving = true;
    try {
      const nextCurrency = currency?.trim().toUpperCase() ?? '';
      if (participant) {
        const current = participantsService.getById(participant.id);
        if (!current) throw new Error('Participant is no longer available');
        // Save the selected profile through the synchronized participant journal.
        await participantsService.save({ ...current, currency: nextCurrency });
      } else {
        await membersService.updateSettings({ currency: nextCurrency });
      }
      opened = false;
    } catch {
      showErrorToast($translate('wallets.save_failed'));
    } finally {
      saving = false;
    }
  }
</script>

<Modal id="main-currency-modal" header={$translate('currency_rates.default_currency')} bind:opened width={20}>
  <form class="flex-col gap-1" data-testId="MainCurrencyForm" on:submit|preventDefault={save}>
    {#if participant}<p class="participant" data-testId="MainCurrencyParticipant">{participant.name}</p>{/if}
    <Input name="currency" label={$translate('accounts.currency')} bind:value={currency} />
    {#if currencies.length}
      <div
        class="recent-currencies"
        data-testId="RecentMainCurrencies"
        role="group"
        aria-label={$translate('currency_rates.recent_currencies')}
      >
        <Tags
          tags={currencies}
          selected={currency ? [currency.trim().toUpperCase()] : []}
          onChange={(id) => (currency = id)}
          readOnly
        />
      </div>
    {/if}
    <div class="grid-col-2 gap-1">
      <Button text={$translate('common.cancel')} color="secondary" onClick={() => (opened = false)} disabled={saving} />
      <Button text={$translate('common.save')} color="primary" type="submit" disabled={saving} />
    </div>
  </form>
</Modal>

<style>
  .participant {
    margin: 0;
    color: var(--secondary-text-color);
    font-size: 0.9rem;
  }
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
