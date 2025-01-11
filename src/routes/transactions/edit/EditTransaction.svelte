<script lang="ts">
  import { accountsStore, categoriesStore, operationsService, operationsStore, operationTagsStore } from '$lib/data';
  import type { Transaction } from '$lib/data/interfaces';
  import { deleteOperation } from '$lib/data/operations';
  import { translate } from '$lib/translate';
  import Button from '@ya-erm/svelte-ui/Button';
  import { showSuccessToast } from '$lib/ui/toasts';

  import TransactionForm from '../form/TransactionForm.svelte';

  export let id: string | null;
  export let onBack: () => void;

  $: transactions = $operationsStore;
  $: accounts = $accountsStore;
  $: categories = $categoriesStore;
  $: tags = $operationTagsStore;

  $: transaction = transactions.find((t) => t.id === id);

  const handleSubmit = async (transactions: Transaction[]) => {
    transactions.forEach((transaction) => operationsService.save(transaction));
    onBack();
  };

  const handleDelete = () => {
    if (!transaction) return;
    deleteOperation(transaction.id);
    showSuccessToast($translate('transactions.delete_transaction_success'), {
      testId: 'DeleteTransactionSuccessToast',
    });
    onBack();
  };
</script>

<TransactionForm {transaction} {accounts} {categories} {tags} onSubmit={handleSubmit}>
  <Button text={$translate('common.save')} type="submit" testId="SaveTransactionButton" />
  <Button
    slot="footer"
    onClick={handleDelete}
    text={$translate('transactions.delete_transaction')}
    testId="DeleteTransactionButton"
    appearance="transparent"
    color="danger"
  />
</TransactionForm>
