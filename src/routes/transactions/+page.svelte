<script lang="ts">
  import { operationsStore } from '$lib/data';
  import { translate } from '$lib/translate';
  import Layout from '$lib/ui/layout/Layout.svelte';
  import AddTransactionButton from './AddTransactionButton.svelte';
  import TransactionList from './TransactionList.svelte';

  $: transactions = $operationsStore;
</script>

<Layout title={$translate('transactions.title')} rightSlot={AddTransactionButton}>
  <TransactionList {transactions} />
</Layout>
