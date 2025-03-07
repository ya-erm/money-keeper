<script lang="ts">
  import { accountsStore, categoriesStore, operationsService, operationTagsStore } from '$lib/data';
  import type { Transaction } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Button from '@ya-erm/svelte-ui/Button';
  import HeaderBackButton from '$lib/ui/layout/HeaderBackButton.svelte';
  import HeaderFormSubmitButton from '$lib/ui/layout/HeaderFormSubmitButton.svelte';
  import Layout from '$lib/ui/layout/Layout.svelte';

  import TransactionForm from '../form/TransactionForm.svelte';

  $: accounts = $accountsStore;
  $: categories = $categoriesStore;
  $: tags = $operationTagsStore;

  const handleSubmit = async (transactions: Transaction[]) => {
    transactions.forEach((transaction) => operationsService.save(transaction));
    history.back();
  };
</script>

<Layout
  title={$translate('transactions.new_transaction')}
  leftSlot={HeaderBackButton}
  rightSlot={HeaderFormSubmitButton}
  hideMenu
>
  <TransactionForm {accounts} {categories} {tags} onSubmit={handleSubmit}>
    <Button text={$translate('common.create')} type="submit" testId="CreateTransactionButton" />
  </TransactionForm>
</Layout>
