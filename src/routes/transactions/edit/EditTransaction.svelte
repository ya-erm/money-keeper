<script lang="ts">
  import { accountsStore, categoriesStore, operationsService, operationsStore, operationTagsStore } from '$lib/data';
  import type { Transaction } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
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
    showSuccessToast($translate('common.save_changes_success'));
    onBack();
  };

  const handleDelete = () => {
    if (!transaction) return;
    const t = operationsService.getById(transaction.id);
    if (t) operationsService.delete(t);
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
    on:click={handleDelete}
    text={$translate('transactions.delete_transaction')}
    testId="DeleteTransactionButton"
    appearance="transparent"
    color="danger"
  />
</TransactionForm>
