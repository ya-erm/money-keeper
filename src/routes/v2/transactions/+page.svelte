<script lang="ts">
  import mainService from '$lib/data/main';
  import { translate } from '$lib/translate';
  import { useRightButton, useTitle } from '$lib/ui/header/header';
  import AddTransactionButton from './AddTransactionButton.svelte';
  import TransactionList from './TransactionList.svelte';

  const store = mainService.$transactions;
  $: transactions = $store;

  useRightButton(AddTransactionButton as any);
  useTitle($translate('transactions.title'));
</script>

<TransactionList {transactions} />
