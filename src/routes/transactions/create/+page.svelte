<script lang="ts">
  import dayjs from 'dayjs';

  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import Input from '$lib/ui/Input.svelte';
  import { showErrorToast } from '$lib/ui/toasts';

  import AccountSelect from '../AccountSelect.svelte';
  import CategorySelect from '../CategorySelect.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
  $: accounts = data.accounts;
  $: categories = data.categories;

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

  const now = dayjs().format('YYYY-MM-DD');
</script>

<form bind:this={formElement} action="?/create" method="POST" on:submit={handleSubmit}>
  <div class="flex-col gap-1 p-1">
    <AccountSelect {accounts} fromUrl />
    <CategorySelect {categories} />
    <Input label={$translate('transactions.date')} name="date" type="date" value={now} required />
    <Input label={$translate('transactions.amount')} name="amount" type="number" required />
    <Input label={$translate('transactions.comment')} name="comment" optional />
    <Button text={$translate('common.create')} type="submit" />
  </div>
</form>
