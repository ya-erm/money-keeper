<script lang="ts">
  import dayjs from 'dayjs';
  import type { TransactionViewModel } from '#lib/data/interfaces.js';
  import { translate } from '#lib/translate/index.js';
  import SearchInput from '#lib/ui/SearchInput.svelte';
  import SubScreen from '#lib/ui/layout/SubScreen.svelte';
  import TransactionList from '../../routes/transactions/TransactionList.svelte';

  export let operations: TransactionViewModel[];
  export let selectedId: string | null = null;
  export let onSelect: (operation: TransactionViewModel) => void;
  export let onClose: () => void;
  let query = '';
  $: terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  $: filtered = operations.filter((operation) => {
    const text = [
      operation.comment,
      operation.description,
      operation.category.name,
      operation.account.name,
      operation.amount,
      operation.account.currency,
      dayjs(operation.date).format('DD.MM.YYYY'),
      dayjs(operation.date).format('YYYY-MM-DD'),
      ...operation.tags.map((tag) => tag.name),
    ]
      .join(' ')
      .toLocaleLowerCase();
    return terms.every((term) => text.includes(term));
  });
</script>

<SubScreen visible title={$translate('debts.select_payment')} onBack={onClose} testId="DebtOperationPicker">
  <div class="search"><SearchInput bind:value={query} name="debt-operation-search" /></div>
  {#if filtered.length}
    <TransactionList transactions={filtered} {selectedId} {onSelect} />
  {:else}<p class="empty">{$translate(terms.length ? 'common.nothing_found' : 'debts.no_payments')}</p>{/if}
</SubScreen>

<style>
  .search {
    position: sticky;
    top: 0;
    z-index: 1;
    padding: 1rem;
    background: var(--background-color);
  }
  .empty {
    margin: 0;
    padding: 0 1rem 1rem;
    color: var(--secondary-text-color);
  }
</style>
