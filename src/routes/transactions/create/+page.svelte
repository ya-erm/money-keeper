<script lang="ts">
  import { accountsStore, categoriesStore, operationsService, operationTagsStore } from '$lib/data';
  import type { Transaction } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import { useTitle } from '$lib/ui/header';

  import { showSuccessToast } from '$lib/ui/toasts';
  import TransactionForm from '../form/TransactionForm.svelte';

  $: accounts = $accountsStore;
  $: categories = $categoriesStore;
  $: tags = $operationTagsStore;

  useTitle($translate('transactions.new_transaction'));

  const handleSubmit = async (transactions: Transaction[]) => {
    transactions.forEach((transaction) => operationsService.save(transaction));
    showSuccessToast($translate('transactions.create_transaction_success'), {
      testId: 'CreateTransactionSuccessToast',
    });
    history.back();
  };
</script>

<TransactionForm {accounts} {categories} {tags} onSubmit={handleSubmit}>
  <Button text={$translate('common.create')} type="submit" testId="CreateTransactionButton" />
</TransactionForm>
