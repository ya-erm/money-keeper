<script lang="ts">
  import { v4 as uuid } from 'uuid';
  import dayjs from 'dayjs';

  import Button from '@ya-erm/svelte-ui/Button';
  import { showErrorToast, showSuccessToast } from '@ya-erm/svelte-ui/toasts';
  import Input from '@ya-erm/svelte-ui/Input';
  import InputLabel from '@ya-erm/svelte-ui/InputLabel';
  import type { AccountViewModel, Transaction } from '$lib/data/interfaces';

  import { SYSTEM_CATEGORY_TRANSFER_IN, SYSTEM_CATEGORY_TRANSFER_OUT } from '$lib/data/categories';
  import { operationsService } from '$lib/data/operations';
  import { translate } from '$lib/translate';
  import Modal from '$lib/ui/Modal.svelte';
  import { formatMoney } from '$lib/utils';
  import { Logger } from '$lib/utils/logger';

  const logger = new Logger('CorrectBalanceModal');

  export let opened: boolean;
  export let account: AccountViewModel;
  export let balance: number | null = null;

  let newBalance = '';

  $: diff = Number(newBalance) - (balance ?? 0);

  const onClose = () => (opened = false);

  const handleSubmit = async () => {
    try {
      const datetime = dayjs().format();

      const transaction: Transaction = {
        id: uuid(),
        accountId: account.id,
        categoryId: diff > 0 ? SYSTEM_CATEGORY_TRANSFER_IN.id : SYSTEM_CATEGORY_TRANSFER_OUT.id,
        date: datetime,
        amount: Math.abs(diff),
        comment: $translate('accounts.correct_balance'),
        tagIds: [],
      };

      operationsService.save(transaction);
      showSuccessToast($translate('transactions.create_transaction_success'));
      onClose();
    } catch (e) {
      logger.error('Failed to correct balance', e, { accountId: account.id, diff });
      showErrorToast($translate('accounts.correct_balance_failure'));
    }
  };
</script>

<Modal bind:opened width={20} header={$translate('accounts.correct_balance')}>
  <form on:submit|preventDefault={handleSubmit} class="flex-col gap-1 select-none">
    <label class="flex-col gap-0.5">
      <InputLabel text={$translate('accounts.current_balance')} />
      <div class="current-balance">
        {formatMoney(balance ?? 0, { currency: account.currency })}
      </div>
    </label>
    <Input
      label={$translate('accounts.new_balance')}
      bind:value={newBalance}
      translate={$translate}
      endText={account.currency}
      inputmode="decimal"
      type="number"
      required
    />
    <label class="flex-col gap-0.5">
      <InputLabel text={$translate('accounts.difference')} />
      <div class:positive={diff > 0} class:negative={diff < 0}>
        {formatMoney(diff, { currency: account.currency })}
      </div>
    </label>
    <div class="grid-col-2 gap-1">
      <Button color="white" text={$translate('common.cancel')} bordered onClick={onClose} />
      <Button text={$translate('common.save')} color="primary" type="submit" />
    </div>
  </form>
</Modal>

<style>
  .current-balance {
    margin-top: 0.5rem;
  }
  .positive {
    color: var(--green-color);
  }
  .negative {
    color: var(--red-color);
  }
</style>
