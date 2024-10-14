<script lang="ts">
  import { accountsStore, categoriesStore, operationsService, operationTagsStore } from '$lib/data';
  import type { Transaction } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import { useTitle } from '$lib/ui/header';
  import HeaderBackButton from '$lib/ui/header/HeaderBackButton.svelte';
  import HeaderFormSubmitButton from '$lib/ui/header/HeaderFormSubmitButton.svelte';
  import { useLeftButton, useRightButton } from '$lib/ui/header/model';

  import TransactionForm from '../form/TransactionForm.svelte';

  $: accounts = $accountsStore;
  $: categories = $categoriesStore;
  $: tags = $operationTagsStore;

  useLeftButton(HeaderBackButton);
  useTitle($translate('transactions.new_transaction'));
  useRightButton(HeaderFormSubmitButton);

  const handleSubmit = async (transactions: Transaction[]) => {
    transactions.forEach((transaction) => operationsService.save(transaction));
    history.back();
  };
</script>

<TransactionForm {accounts} {categories} {tags} onSubmit={handleSubmit}>
  <Button text={$translate('common.create')} type="submit" testId="CreateTransactionButton" />
</TransactionForm>
