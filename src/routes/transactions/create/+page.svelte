<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import { showSuccessToast } from '$lib/ui/toasts';
  import { getNumberSearchParam } from '$lib/utils/getSearchParam';

  import TransactionForm from '../TransactionForm.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
  $: accounts = data.accounts;
  $: categories = data.categories;
  $: tags = data.tags;
  $: accountId = getNumberSearchParam($page, 'accountId');

  const onSuccess = async () => {
    showSuccessToast($translate('transactions.create_transaction_success'));
    await goto(`${routes.accounts.path}#account-card-${accountId}`);
  };
</script>

<TransactionForm {accounts} {categories} {tags} action="?/create" {onSuccess}>
  <Button text={$translate('common.create')} type="submit" />
  <div slot="footer" class="flex-center mb-1">
    <a href={routes['transactions.import'].path + (accountId ? `?accountId=${accountId}` : '')}>
      {$translate('transactions.import')}
    </a>
  </div>
</TransactionForm>
