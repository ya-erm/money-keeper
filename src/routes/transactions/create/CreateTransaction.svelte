<script lang="ts">
  import Button from '@ya-erm/svelte-ui/Button';

  import { accountsStore, categoriesStore, operationsService, operationTagsStore } from '$lib/data';
  import type { Transaction } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';

  import TransactionForm from '../form/TransactionForm.svelte';

  export let onDone: () => void;

  $: accounts = $accountsStore;
  $: categories = $categoriesStore;
  $: tags = $operationTagsStore;

  const handleSubmit = async (transactions: Transaction[]) => {
    transactions.forEach((transaction) => operationsService.save(transaction));
    onDone();
  };
</script>

<TransactionForm {accounts} {categories} {tags} onSubmit={handleSubmit}>
  <Button text={$translate('common.create')} type="submit" testId="CreateTransactionButton" />
</TransactionForm>
