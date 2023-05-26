<script lang="ts">
  import { goto } from '$app/navigation';

  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import FormContainer from '$lib/ui/FormContainer.svelte';
  import { useTitle } from '$lib/ui/header';
  import { showSuccessToast } from '$lib/ui/toasts';

  import TransactionForm from '../TransactionForm.svelte';
  import type { PageData } from './$types';

  useTitle($translate('transactions.edit_transaction'));

  export let data: PageData;
  $: accounts = data?.accounts;
  $: categories = data?.categories;
  $: transaction = data?.transaction;
  $: tags = data?.tags;

  const onSuccess = () => {
    showSuccessToast($translate('common.save_changes_success'));
    goto(`${routes.accounts.path}?account-card=${transaction.account.id}`);
  };

  const handleDelete = () => {
    showSuccessToast($translate('transactions.delete_transaction_success'));
    goto(`${routes.accounts.path}?account-card=${transaction.account.id}`);
  };
</script>

<TransactionForm action="?/update" {accounts} {categories} {tags} {transaction} {onSuccess}>
  <Button text={$translate('common.save')} type="submit" testId="SaveTransactionButton" />
  <FormContainer slot="footer" action="?/delete" onResult={handleDelete}>
    <Button
      text={$translate('transactions.delete_transaction')}
      testId="DeleteTransactionButton"
      appearance="transparent"
      color="danger"
      type="submit"
    />
  </FormContainer>
</TransactionForm>
