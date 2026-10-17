<script lang="ts">
  import { page } from '$app/stores';

  import { operationsStore } from '$lib/data';
  import { translate } from '$lib/translate';
  import Layout from '$lib/ui/layout/Layout.svelte';
  import { isWideScreen } from '$lib/ui/layout/media';
  import { deleteSearchParam, getSearchParam } from '$lib/utils';

  import AddTransactionButton from './AddTransactionButton.svelte';
  import OperationDetails from './OperationDetails.svelte';
  import TransactionList from './TransactionList.svelte';

  $: transactions = $operationsStore;

  $: operationId = getSearchParam($page, 'operation-id');
  const closeOperation = () => void deleteSearchParam($page, ['operation-id', 'accountId']);
</script>

<Layout title={$translate('transactions.title')} rightSlot={AddTransactionButton}>
  <div class="container">
    <TransactionList {transactions} inlineDetails={$isWideScreen} />
  </div>
  <OperationDetails slot="details" {operationId} onClose={closeOperation} />
</Layout>

<style>
  .container {
    height: 100%;
    overflow-y: auto;
  }
</style>
