<script lang="ts">
  import { goto } from '$app/navigation';

  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import FormContainer from '$lib/ui/FormContainer.svelte';
  import { title } from '$lib/ui/header';
  import { showSuccessToast } from '$lib/ui/toasts';

  import TransactionForm from '../TransactionForm.svelte';
  import type { PageData } from './$types';

  title.set($translate('transactions.edit_transaction'));

  export let data: PageData;
  $: accounts = data?.accounts;
  $: categories = data?.categories;
  $: transaction = data?.transaction;

  const onSuccess = () => {
    showSuccessToast($translate('common.save_changes_success'));
    goto(`${routes.accounts.path}#account-card-${transaction.account.id}`);
  };

  const handleDelete = () => {
    showSuccessToast($translate('transactions.delete_transaction_success'));
    goto(`${routes.accounts.path}#account-card-${transaction.account.id}`);
  };
</script>

<TransactionForm action="?/update" {accounts} {categories} {transaction} {onSuccess}>
  <Button text={$translate('common.save')} type="submit" />
  <FormContainer slot="footer" action="?/delete" onResult={handleDelete}>
    <Button
      text={$translate('transactions.delete_transaction')}
      appearance="transparent"
      color="danger"
      type="submit"
    />
  </FormContainer>
</TransactionForm>
