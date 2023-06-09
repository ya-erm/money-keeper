<script lang="ts">
  import { operationsStore } from '$lib/data';
  import { translate } from '$lib/translate';
  import { useRightButton, useTitle } from '$lib/ui/header/model';
  import AddTransactionButton from './AddTransactionButton.svelte';
  import TransactionList from './TransactionList.svelte';

  $: transactions = $operationsStore;

  useRightButton(AddTransactionButton);
  useTitle($translate('transactions.title'));
</script>

<TransactionList {transactions} />
