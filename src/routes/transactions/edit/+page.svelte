<script lang="ts">
  import { page } from '$app/stores';

  import { accountsService, categoriesService, mainService, tagsService, transactionsService } from '$lib/data';
  import type { Transaction } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import { useTitle } from '$lib/ui/header';
  import { showSuccessToast } from '$lib/ui/toasts';
  import { getSearchParam } from '$lib/utils';

  import TransactionForm from '../form/TransactionForm.svelte';

  useTitle($translate('transactions.edit_transaction'));

  const transactions = mainService.$transactions;
  const accounts = accountsService.$accounts;
  const categories = categoriesService.$categories;
  const tags = tagsService.$tags;

  $: id = getSearchParam($page, 'id');
  $: transaction = $transactions.find((t) => t.id === id);

  const handleSubmit = async (transactions: Transaction[]) => {
    transactions.forEach((transaction) => transactionsService.save(transaction));
    showSuccessToast($translate('common.save_changes_success'));
    history.back();
  };

  const handleDelete = () => {
    if (!transaction) return;
    const t = transactionsService.getById(transaction.id);
    t && transactionsService.delete(t);
    showSuccessToast($translate('transactions.delete_transaction_success'), {
      testId: 'DeleteTransactionSuccessToast',
    });
    history.back();
  };
</script>

<TransactionForm {transaction} accounts={$accounts} categories={$categories} tags={$tags} onSubmit={handleSubmit}>
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
