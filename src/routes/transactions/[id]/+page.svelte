<script lang="ts">
  import dayjs from 'dayjs';

  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { ActionResult } from '@sveltejs/kit';

  import type { CategoryType } from '$lib/interfaces';
  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import FormContainer from '$lib/ui/FormContainer.svelte';
  import { title } from '$lib/ui/header';
  import Input from '$lib/ui/Input.svelte';
  import InputLabel from '$lib/ui/InputLabel.svelte';
  import { showErrorToast } from '$lib/ui/toasts';

  import AccountSelect from '../AccountSelect.svelte';
  import CategorySelect from '../CategorySelect.svelte';
  import TypeSwitch from '../TypeSwitch.svelte';

  import type { PageData } from './$types';

  title.set($translate('transactions.edit_transaction'));

  export let data: PageData;
  $: accounts = data?.accounts;
  $: categories = data?.categories;
  const transaction = data?.transaction;

  $: type = ($page.url.searchParams.get('type') as CategoryType) ?? 'OUT';

  const handleSubmit = (e: SubmitEvent) => {
    const formData = new FormData(e.target as HTMLFormElement);
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

<form action="?/update" method="POST" on:submit={handleSubmit} use:enhance={() => handleResult}>
  <div class="flex-col gap-1 p-1">
    <TypeSwitch />
    <AccountSelect {accounts} accountId={transaction.account.id} />
    <CategorySelect {categories} {type} categoryId={transaction.category.id} />
    <div class="flex-col gap-0.5">
      <InputLabel text={$translate('transactions.dateTime')} />
      <div class="flex gap-1">
        <Input name="date" type="date" value={dayjs(transaction?.date).format('YYYY-MM-DD')} required />
        <Input name="time" type="time" value={dayjs(transaction?.date).format('HH:mm')} required />
      </div>
    </div>
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
