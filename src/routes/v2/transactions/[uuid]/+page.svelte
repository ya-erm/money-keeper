<script lang="ts">
  import { page } from '$app/stores';
  import { accountsService, categoriesService, mainService, tagsService, transactionsService } from '$lib/data';
  import type { Transaction } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';

  import TransactionForm from '../form/TransactionForm.svelte';

  const transactions = mainService.$transactions;
  const accounts = accountsService.$accounts;
  const categories = categoriesService.$categories;
  const tags = tagsService.$tags;

  const transaction = $transactions.find((t) => t.id === $page.params.uuid);

  const handleSubmit = async (transactions: Transaction[]) => {
    transactions.forEach((transaction) => transactionsService.save(transaction));
    history.back();
  };
  const handleDelete = () => {
    if (!transaction) return;
    const t = transactionsService.getById(transaction.id);
    t && transactionsService.delete(t);
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
