<script lang="ts">
  import { accountsService, categoriesService, tagsService, transactionsService } from '$lib/data';
  import type { Transaction } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import { useTitle } from '$lib/ui/header';

  import { showSuccessToast } from '$lib/ui/toasts';
  import TransactionForm from '../form/TransactionForm.svelte';

  const accounts = accountsService.$accounts;
  const categories = categoriesService.$categories;
  const tags = tagsService.$tags;

  useTitle($translate('transactions.new_transaction'));

  const handleSubmit = async (transactions: Transaction[]) => {
    transactions.forEach((transaction) => transactionsService.save(transaction));
    showSuccessToast($translate('transactions.create_transaction_success'), {
      testId: 'CreateTransactionSuccessToast',
    });
    history.back();
  };
</script>

<TransactionForm accounts={$accounts} categories={$categories} tags={$tags} onSubmit={handleSubmit}>
  <Button text={$translate('common.create')} type="submit" testId="CreateTransactionButton" />
</TransactionForm>
