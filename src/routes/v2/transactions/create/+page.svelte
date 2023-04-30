<script lang="ts">
  import type { Transaction } from '$lib/data/interfaces';
  import { accountsService, categoriesService, tagsService, transactionsService } from '$lib/data';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import { useTitle } from '$lib/ui/header';

  import TransactionForm from '../form/TransactionForm.svelte';

  const accounts = accountsService.$accounts;
  const categories = categoriesService.$categories;
  const tags = tagsService.$tags;

  useTitle($translate('transactions.new_transaction'));

  const handleSubmit = async (transactions: Transaction[]) => {
    transactions.forEach((transaction) => transactionsService.save(transaction));
    history.back();
  };
</script>

<TransactionForm accounts={$accounts} categories={$categories} tags={$tags} onSubmit={handleSubmit}>
  <Button text={$translate('common.create')} type="submit" testId="CreateTransactionButton" />
</TransactionForm>
