<script lang="ts">
  import { page } from '#lib/page.js';

  import { operationsStore } from '#lib/data/index.js';
  import { translate } from '#lib/translate/index.js';
  import Layout from '#lib/ui/layout/Layout.svelte';
  import { isWideScreen } from '#lib/ui/layout/media.js';
  import { deleteSearchParam, getSearchParam } from '#lib/utils/index.js';

  import AddTransactionButton from './AddTransactionButton.svelte';
  import OperationsSplitView from './OperationsSplitView.svelte';
  import TransactionList from './TransactionList.svelte';

  $: transactions = $operationsStore;

  $: operationId = getSearchParam($page, 'operation-id');
  const closeOperation = () => void deleteSearchParam($page, ['operation-id', 'accountId']);
</script>

<Layout title={$translate('transactions.title')} rightSlot={AddTransactionButton} wide>
  <OperationsSplitView {operationId} onClose={closeOperation}>
    <div class="container">
      <TransactionList {transactions} inlineDetails={$isWideScreen} />
    </div>
  </OperationsSplitView>
</Layout>

<style>
  .container {
    height: 100%;
    overflow-y: auto;
  }
</style>
