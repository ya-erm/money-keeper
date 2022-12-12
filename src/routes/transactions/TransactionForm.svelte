<script lang="ts">
  import dayjs from 'dayjs';

  import { applyAction, enhance } from '$app/forms';
  import { invalidate } from '$app/navigation';
  import { page } from '$app/stores';
  import type { Account, Category } from '@prisma/client';
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

  export let accounts: Account[];
  export let categories: Category[];
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

  const handleResult = async ({ form, result }: { form: HTMLFormElement; result: ActionResult }) => {
    if (result.type === 'invalid') {
      const formData = new FormData(form);
      if (!formData.get('accountId')) {
        showErrorToast($translate('transactions.account_is_required'));
        return;
      }
      if ((type === 'IN' || type === 'OUT') && !formData.get('categoryId')) {
        showErrorToast($translate('transactions.category_is_required'));
        return;
      }
      if (type === 'TRANSFER' && !formData.get('destinationAccountId')) {
        showErrorToast($translate('transactions.destination_account_is_required'));
        return;
      }
      if (type === 'TRANSFER' && formData.get('accountId') === formData.get('destinationAccountId')) {
        showErrorToast($translate('transactions.accounts_must_be_different'));
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

<form method="POST" {action} use:enhance={() => handleResult}>
  <div class="flex-col gap-1 p-1">
    <TypeSwitch bind:type disabled={isTransfer} />
    {#if type === 'OUT'}
      <AccountSelect {accounts} bind:accountId />
    {/if}
    {#if type === 'TRANSFER'}
      <AccountSelect name="accountId" label={$translate('transactions.from')} bind:accountId {accounts} />
      <AccountSelect
        name="destinationAccountId"
        label={$translate('transactions.to')}
        bind:accountId={destinationAccountId}
        {accounts}
      />
    {/if}
    {#if type === 'IN' || type === 'OUT'}
      <CategorySelect {type} bind:categoryId categories={categories.filter((c) => c.type === type)} />
    {/if}
    {#if type === 'IN'}
      <AccountSelect {accounts} bind:accountId />
    {/if}
    <div class="flex-col gap-0.5">
      <InputLabel text={$translate('transactions.dateTime')} />
      <div class="flex gap-1">
        <Input name="date" type="date" value={dayjs(transaction?.date).format('YYYY-MM-DD')} required />
        <Input name="time" type="time" value={dayjs(transaction?.date).format('HH:mm')} required />
      </div>
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
    <slot />
    <slot name="button" />
    <slot name="footer" />
  </div>
</form>
