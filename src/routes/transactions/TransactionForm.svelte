<script lang="ts">
  import dayjs from 'dayjs';

  import { applyAction, enhance } from '$app/forms';
  import { invalidate } from '$app/navigation';
  import { page } from '$app/stores';
  import type { Account, Category, Tag } from '@prisma/client';
  import type { ActionResult } from '@sveltejs/kit';

  import { isApiErrorData } from '$lib/api';
  import { deps } from '$lib/deps';
  import { translate } from '$lib/translate';
  import Input from '$lib/ui/Input.svelte';
  import InputLabel from '$lib/ui/InputLabel.svelte';
  import { showErrorToast } from '$lib/ui/toasts';
  import { getNumberSearchParam, getSearchParam } from '$lib/utils/getSearchParam';

  import type { TransactionFullDto } from '$lib/interfaces';
  import AccountSelect from './AccountSelect.svelte';
  import CategorySelect from './CategorySelect.svelte';
  import TypeSwitch from './TypeSwitch.svelte';
  import Tags from '$lib/ui/Tags.svelte';

  export let accounts: Account[];
  export let categories: Category[];
  export let tags: Tag[];

  export let transaction: TransactionFullDto | null = null;

  export let action: string;
  export let onSuccess: ((result: ActionResult) => void | Promise<void>) | null = null;

  const isTransfer = !!transaction?.linkedTransactionId;
  const sourceTransaction =
    isTransfer && transaction?.category.type === 'OUT' ? transaction : transaction?.linkedTransaction;
  const destinationTransaction =
    isTransfer && transaction?.category.type === 'IN' ? transaction : transaction?.linkedTransaction;

  let type = isTransfer ? 'TRANSFER' : transaction ? transaction.category.type : getSearchParam($page, 'type') ?? 'OUT';

  let categoryId = transaction?.categoryId ?? getNumberSearchParam($page, 'categoryId');

  let accountId = isTransfer
    ? sourceTransaction?.accountId
    : transaction?.accountId ?? getNumberSearchParam($page, 'accountId');
  let destinationAccountId = isTransfer
    ? destinationTransaction?.accountId
    : getNumberSearchParam($page, 'destinationAccountId');

  let date = dayjs(transaction?.date).format('YYYY-MM-DD');
  let time = dayjs(transaction?.date).format('HH:mm');
  $: datetime = new Date([date, time].join('T')).toISOString();

  const addTag = async (name: string) => {
    const response = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (response.ok) {
      const data = await response.json();
      tags = [...tags, data];
      selectedTags = [...selectedTags, data.id];
      // await invalidate(deps.tags);
    } else {
      showErrorToast($translate('tags.add_tag_failure'));
    }
  };

  const editTag = async (id: string, name: string) => {
    const response = await fetch(`/api/tags/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (response.ok) {
      const data = await response.json();
      tags = tags.map((tag) => (tag.id === Number(id) ? data : tag));
    } else {
      showErrorToast($translate('tags.edit_tag_failure'));
    }
  };

  const deleteTag = async (id: string) => {
    const response = await fetch(`/api/tags/${id}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      tags = tags.filter((tag) => tag.id !== Number(id));
    } else {
      showErrorToast($translate('tags.delete_tag_failure'));
    }
  };

  let selectedTags = transaction?.tags.map((t) => `${t.id}`) ?? [];

  const toggleTag = async (tagId: string, selected: boolean) => {
    selectedTags = selected ? [...selectedTags, tagId] : selectedTags.filter((t) => t !== tagId);
  };

  const handleResult = async ({ form, result }: { form: HTMLFormElement; result: ActionResult }) => {
    if (result.type === 'failure') {
      const formData = new FormData(form);
      if (!formData.get('accountId')) {
        showErrorToast($translate('transactions.account_is_required'), { testId: 'AccountIsRequiredErrorToast' });
        return;
      }
      if ((type === 'IN' || type === 'OUT') && !formData.get('categoryId')) {
        showErrorToast($translate('transactions.category_is_required'), { testId: 'CategoryIsRequiredErrorToast' });
        return;
      }
      if (type === 'TRANSFER' && !formData.get('destinationAccountId')) {
        showErrorToast($translate('transactions.destination_account_is_required'), {
          testId: 'DestinationAccountIsRequiredErrorToast',
        });
        return;
      }
      if (type === 'TRANSFER' && formData.get('accountId') === formData.get('destinationAccountId')) {
        showErrorToast($translate('transactions.accounts_must_be_different'), {
          testId: 'AccountsMustBeDifferentErrorToast',
        });
        return;
      }
      if (isApiErrorData(result.data)) {
        showErrorToast(result.data.error.message);
      }
    }
    if (result.type === 'success') {
      await invalidate(deps.transactions);
      await onSuccess?.(result);
    }
    await applyAction(result);
  };
</script>

<form method="POST" {action} use:enhance={() => handleResult} data-testId="TransactionForm">
  <div class="flex-col gap-1 p-1">
    <TypeSwitch bind:type disabled={isTransfer} />
    {#if type === 'OUT'}
      <AccountSelect {accounts} bind:accountId testId="SourceAccountSelect" />
    {/if}
    {#if type === 'TRANSFER'}
      <AccountSelect
        name="accountId"
        testId="SourceAccountSelect"
        label={$translate('transactions.from')}
        bind:accountId
        {accounts}
      />
      <AccountSelect
        name="destinationAccountId"
        testId="DestinationAccountSelect"
        label={$translate('transactions.to')}
        bind:accountId={destinationAccountId}
        {accounts}
      />
    {/if}
    {#if type === 'IN' || type === 'OUT'}
      <CategorySelect {type} bind:categoryId categories={categories.filter((c) => c.type === type)} />
    {/if}
    {#if type === 'IN'}
      <AccountSelect {accounts} bind:accountId testId="DestinationAccountSelect" />
    {/if}
    <div class="flex-col gap-0.5">
      <InputLabel text={$translate('transactions.dateTime')} />
      <div class="flex gap-1">
        <Input name="date" type="date" bind:value={date} required />
        <Input name="time" type="time" bind:value={time} required />
      </div>
      <input name="datetime" value={datetime} class="hidden" readonly />
    </div>
    <div class="flex-col gap-0.5">
      <InputLabel text={$translate('transactions.amount')} />
      <div class="flex gap-1">
        <Input
          type="number"
          name="amount"
          value={(isTransfer ? sourceTransaction?.amount : transaction?.amount)?.toString()}
          endText={accounts.find(({ id }) => id === accountId)?.currency}
          required
        />
        {#if type === 'TRANSFER'}
          <Input
            type="number"
            name="destinationAmount"
            value={destinationTransaction?.amount.toString()}
            endText={accounts.find(({ id }) => id === destinationAccountId)?.currency}
            required
          />
        {/if}
      </div>
    </div>
    <Input label={$translate('transactions.comment')} name="comment" value={transaction?.comment} optional />
    <div class="flex-col gap-0.5">
      <InputLabel text={$translate('transactions.tags')} optional />
      <Tags
        tags={tags?.map((t) => ({ id: `${t.id}`, title: t.name })) ?? []}
        selected={selectedTags}
        onChange={toggleTag}
        onAdd={addTag}
        onEdit={editTag}
        onDelete={deleteTag}
      />
      <input name="tags" class="hidden" multiple value={selectedTags} />
    </div>
    <slot />
    <slot name="button" />
    <slot name="footer" />
  </div>
</form>
