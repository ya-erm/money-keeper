<script lang="ts">
  import dayjs from 'dayjs';
  import type { ActionResult } from '@sveltejs/kit';

  import { enhance } from '$app/forms';
  import { page } from '$app/stores';

  import type { CategoryType } from '$lib/interfaces';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import FormContainer from '$lib/ui/FormContainer.svelte';
  import { title } from '$lib/ui/header';
  import Input from '$lib/ui/Input.svelte';
  import { showErrorToast } from '$lib/ui/toasts';

  import AccountSelect from '../AccountSelect.svelte';
  import CategorySelect from '../CategorySelect.svelte';
  import TypeSwitch from '../TypeSwitch.svelte';

  import type { PageData } from './$types';
  import { goto } from '$app/navigation';
  import { routes } from '$lib/routes';

  title.set($translate('transactions.edit_transaction'));

  export let data: PageData;
  $: accounts = data?.accounts;
  $: categories = data?.categories;
  const transaction = data?.transaction;

  $: type = ($page.url.searchParams.get('type') as CategoryType) ?? 'OUT';

  let formElement: HTMLFormElement;
  const handleSubmit = (e: SubmitEvent) => {
    const formData = new FormData(formElement);
    if (!formData.get('accountId')) {
      showErrorToast($translate('transactions.account_is_required'));
      e.preventDefault();
      return;
    }
    if (!formData.get('categoryId')) {
      showErrorToast($translate('transactions.category_is_required'));
      e.preventDefault();
      return;
    }
  };

  const handleResult = async ({ result }: { result: ActionResult }) => {
    // TODO: replace to fetch api
    if (result.type === 'redirect') {
      goto(`${routes.accounts.path}#account-card-${transaction.account.id}`);
    }
  };
</script>

<form bind:this={formElement} action="?/update" method="POST" on:submit={handleSubmit} use:enhance={() => handleResult}>
  <div class="flex-col gap-1 p-1">
    <TypeSwitch />
    <AccountSelect {accounts} accountId={transaction.account.id} />
    <CategorySelect {categories} {type} categoryId={transaction.category.id} />
    <Input
      label={$translate('transactions.date')}
      value={dayjs(transaction?.date).format('YYYY-MM-DD')}
      name="date"
      type="date"
      required
    />
    <Input
      label={$translate('transactions.amount')}
      value={`${transaction?.amount}`}
      name="amount"
      type="number"
      required
    />
    <Input value={transaction?.comment} label={$translate('transactions.comment')} name="comment" optional />
    <Button text={$translate('common.save')} type="submit" />
    <FormContainer action="?/delete">
      <Button
        text={$translate('transactions.delete_transaction')}
        appearance="transparent"
        color="danger"
        type="submit"
      />
    </FormContainer>
  </div>
</form>
