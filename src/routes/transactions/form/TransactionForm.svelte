<script lang="ts">
  import dayjs from 'dayjs';
  import { v4 as uuid } from 'uuid';

  import { page } from '$app/stores';
  import { memberSettingsStore, membersService, operationTagsService } from '$lib/data';
  import { SYSTEM_CATEGORY_TRANSFER_IN, SYSTEM_CATEGORY_TRANSFER_OUT } from '$lib/data/categories';
  import type { AccountViewModel, Category, Tag, Transaction, TransactionViewModel } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import Input from '$lib/ui/Input.svelte';
  import InputLabel from '$lib/ui/InputLabel.svelte';
  import Layout from '$lib/ui/Layout.svelte';
  import Modal from '$lib/ui/Modal.svelte';
  import Portal from '$lib/ui/Portal.svelte';
  import { showErrorToast } from '$lib/ui/toasts';
  import { formatMoney, getSearchParam, getTimeZoneOffset, handleError } from '$lib/utils';
  import { replaceCalcExpressions } from '$lib/utils/calc';
  import {
    checkNumberFormParameter,
    checkStringFormParameter,
    checkStringOptionalFormParameter,
  } from '$lib/utils/checkFormParams';
  import TagsList from '$lib/widgets/TagsList.svelte';
  import TimeZoneList from '$lib/widgets/TimeZoneList.svelte';

  import AccountSelector from './AccountSelector.svelte';
  import CategorySelect from './CategorySelect.svelte';
  import TypeSwitch from './TypeSwitch.svelte';

  $: settings = $memberSettingsStore;

  export let accounts: AccountViewModel[];
  export let categories: Category[];
  export let tags: Tag[];

  export let transaction: TransactionViewModel | null = null;

  export let onSubmit: (transactions: Transaction[]) => void;

  const isTransfer = !!transaction?.linkedTransactionId;
  const sourceTransaction =
    isTransfer && transaction?.category.type === 'OUT' ? transaction : transaction?.linkedTransaction;
  const destinationTransaction =
    isTransfer && transaction?.category.type === 'IN' ? transaction : transaction?.linkedTransaction;

  let type = isTransfer ? 'TRANSFER' : transaction ? transaction.category.type : getSearchParam($page, 'type') ?? 'OUT';

  let categoryId = transaction?.categoryId ?? getSearchParam($page, 'categoryId');

  let timeZone = transaction ? transaction?.timeZone ?? undefined : dayjs.tz.guess();
  let timeZoneShift = timeZone ? getTimeZoneOffset(timeZone) : undefined;
  let timeZoneListVisible = false;

  let date = dayjs(transaction?.date).tz(timeZone).format('YYYY-MM-DD');
  let time = dayjs(transaction?.date).tz(timeZone).format('HH:mm');
  $: datetime = timeZone ? dayjs.tz(`${date} ${time}`, timeZone).format() : dayjs(`${date} ${time}`).tz('UTC').format();

  let inputRef: HTMLInputElement | null = null;

  let accountId = isTransfer
    ? sourceTransaction?.accountId
    : transaction?.accountId ?? getSearchParam($page, 'accountId');
  let destinationAccountId = isTransfer
    ? destinationTransaction?.accountId
    : getSearchParam($page, 'destinationAccountId');

  $: accountCurrency = accounts.find(({ id }) => id === accountId)?.currency;
  $: destinationAccountCurrency = accounts.find(({ id }) => id === destinationAccountId)?.currency;

  let _value1 = (isTransfer ? sourceTransaction?.amount : transaction?.amount)?.toString() ?? '';
  let _value2 = destinationTransaction?.amount?.toString() ?? transaction?.anotherCurrencyAmount?.toString() ?? '';
  $: _rate = Number(_value1) / Number(_value2);

  let selectingAccount = false;
  let selectingDestinationAccount = false;

  let selectedTags = transaction?.tags.map((t) => `${t.id}`) ?? [];

  let comment = transaction?.comment ?? '';

  let anotherCurrencyModalOpened = false;
  let anotherCurrency: string | null = transaction?.anotherCurrency ?? null;

  const handleSubmit = async (e: Event) => {
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      if (!formData.get('accountId') || formData.get('accountId') === 'undefined') {
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

      const transactions: Transaction[] = [];

      transactions.push({
        id: transaction?.id ?? uuid(),
        accountId: checkStringFormParameter(formData, 'accountId'),
        categoryId:
          type === 'TRANSFER' ? SYSTEM_CATEGORY_TRANSFER_OUT.id : checkStringFormParameter(formData, 'categoryId'),
        date: datetime,
        ...(timeZone ? { timeZone } : {}),
        amount: checkNumberFormParameter(formData, 'amount'),
        comment: checkStringOptionalFormParameter(formData, 'comment'),
        tagIds: selectedTags,
        ...(anotherCurrency
          ? {
              anotherCurrency,
              anotherCurrencyAmount: checkNumberFormParameter(formData, 'destinationAmount'),
            }
          : {}),
      });

      if (type === 'TRANSFER') {
        transactions.push({
          id: transaction?.linkedTransactionId ?? uuid(),
          accountId: checkStringFormParameter(formData, 'destinationAccountId'),
          categoryId: SYSTEM_CATEGORY_TRANSFER_IN.id,
          date: datetime,
          timeZone,
          amount: checkNumberFormParameter(formData, 'destinationAmount'),
          comment: checkStringOptionalFormParameter(formData, 'comment'),
          tagIds: selectedTags,
          linkedTransactionId: transactions[0].id,
        });
        transactions[0].linkedTransactionId = transactions[1].id;
      }

      onSubmit(transactions);
    } catch (e) {
      handleError(e);
    }
  };
</script>

<form on:submit|preventDefault={handleSubmit} data-testId="TransactionForm">
  <div class="flex-col gap-1 p-1">
    <TypeSwitch bind:type disabled={isTransfer} />
    {#if type === 'OUT'}
      <AccountSelector bind:accountId bind:selecting={selectingAccount} testId="SourceAccountSelect" />
    {/if}
    {#if type === 'TRANSFER'}
      <AccountSelector
        bind:accountId
        bind:selecting={selectingAccount}
        label={$translate('transactions.from')}
        testId="SourceAccountSelect"
      />
      <AccountSelector
        name="destinationAccountId"
        bind:accountId={destinationAccountId}
        bind:selecting={selectingDestinationAccount}
        label={$translate('transactions.to')}
        testId="DestinationAccountSelect"
      />
    {/if}
    {#if type === 'IN' || type === 'OUT'}
      <CategorySelect
        {type}
        bind:categoryId
        categories={categories.filter((c) => c.type === type)}
        onChange={() => {
          inputRef?.focus({ preventScroll: true });
          inputRef?.scrollIntoView({ behavior: 'smooth' });
        }}
      />
    {/if}
    {#if type === 'IN'}
      <AccountSelector bind:accountId bind:selecting={selectingAccount} testId="DestinationAccountSelect" />
    {/if}
    <div class="flex-col gap-0.5">
      <div class="flex gap-1 justify-between">
        <span class="flex-shrink-0">
          <InputLabel text={$translate('transactions.dateTime')} />
        </span>
        <Button appearance="link" underlined={false} on:click={() => (timeZoneListVisible = true)}>
          {#if timeZone}
            <div class="flex gap-0.25">
              <span class="time-zone">{timeZone}</span>
              <span class="time-shift">(GMT{timeZoneShift})</span>
            </div>
          {:else}
            {$translate('timezones.select_time_zone')}
          {/if}
        </Button>
      </div>
      <div class="flex gap-1">
        <Input name="date" type="date" bind:value={date} required />
        <Input name="time" type="time" bind:value={time} required />
      </div>
      <input name="datetime" value={datetime} class="hidden" readonly />
    </div>
    <div class="flex-col gap-0.5">
      <div class="flex justify-between">
        <InputLabel text={$translate('transactions.amount')} />
        {#if type !== 'TRANSFER'}
          {#if !anotherCurrency}
            <Button
              appearance="link"
              underlined={false}
              on:click={() => {
                anotherCurrencyModalOpened = true;
                anotherCurrency = settings?.lastAnotherCurrency ?? null;
              }}
            >
              {$translate('transactions.another_currency')}
            </Button>
          {:else}
            <Button appearance="link" underlined={false} on:click={() => (anotherCurrency = null)}>
              {$translate('transactions.same_currency')}
            </Button>
          {/if}
        {/if}
      </div>
      <div class="flex gap-1">
        <Input
          type="number"
          name="amount"
          inputmode="decimal"
          bind:ref={inputRef}
          bind:value={_value1}
          endText={accountCurrency}
          required
        />
        {#if type === 'TRANSFER' || !!anotherCurrency}
          <Input
            type="number"
            name="destinationAmount"
            bind:value={_value2}
            endText={destinationAccountCurrency || anotherCurrency}
            required
          />
        {/if}
      </div>
      {#if (type === 'TRANSFER' || !!anotherCurrency) && Number(_value1) && Number(_value2)}
        <div class="currency-rate-info">
          {`1 ${accountCurrency} = ${formatMoney(1 / _rate, {
            maxPrecision: 4,
            currency: destinationAccountCurrency || (anotherCurrency ?? undefined),
          })}`}
          {`(1 ${destinationAccountCurrency || anotherCurrency} = ${formatMoney(_rate, {
            maxPrecision: 4,
            currency: accountCurrency,
          })})`}
        </div>
      {/if}
    </div>
    <Input
      label={$translate('transactions.comment')}
      name="comment"
      value={transaction?.comment}
      onChange={(value) => (comment = value)}
      optional
    />
    {#if comment && replaceCalcExpressions(comment) !== comment}
      <div class="comment-preview">
        {replaceCalcExpressions(comment)}
      </div>
    {/if}
    <div class="flex-col gap-0.5">
      <InputLabel text={$translate('transactions.tags')} optional />
      <TagsList
        bind:tags
        bind:selectedTags
        onAdd={(t) => operationTagsService.save(t)}
        onEdit={(t) => operationTagsService.save(t)}
        onDelete={(t) => operationTagsService.delete(t)}
      />
    </div>
    <slot />
    <slot name="button" />
    <slot name="footer" />
  </div>
</form>

<Modal opened={anotherCurrencyModalOpened}>
  <form
    class="flex-col gap-1"
    on:submit|preventDefault={async (e) => {
      anotherCurrency = new FormData(e.currentTarget).get('another-currency')?.toString() ?? null;
      if (anotherCurrency !== settings?.lastAnotherCurrency) {
        await membersService.updateSettings({ lastAnotherCurrency: anotherCurrency });
      }
      anotherCurrencyModalOpened = false;
    }}
  >
    <Input
      label={$translate('transactions.another_currency')}
      value={anotherCurrency}
      name="another-currency"
      clearable
    />
    <div class="grid-col-2 gap-1">
      <Button
        color="secondary"
        text={$translate('common.cancel')}
        on:click={() => (anotherCurrencyModalOpened = false)}
      />
      <Button text={$translate('common.save')} color="primary" type="submit" />
    </div>
  </form>
</Modal>

<Portal visible={timeZoneListVisible}>
  <Layout
    header={{
      title: $translate('timezones.select_time_zone'),
      backButton: { title: $translate('common.back'), onClick: () => (timeZoneListVisible = false) },
    }}
  >
    <TimeZoneList
      onClick={(tz, shift) => {
        timeZone = tz;
        timeZoneShift = shift;
        date = dayjs.utc(datetime).tz(timeZone).format('YYYY-MM-DD');
        time = dayjs.utc(datetime).tz(timeZone).format('HH:mm');
        timeZoneListVisible = false;
      }}
    />
  </Layout>
</Portal>

<style>
  .currency-rate-info {
    font-size: 0.9rem;
    text-align: right;
    color: var(--secondary-text-color);
  }
  .comment-preview {
    font-size: 0.9em;
    margin-top: -0.5rem;
    margin-left: 0.5rem;
    color: var(--secondary-text-color);
  }
  .time-zone {
    flex-shrink: 1;
    text-align: left;
    display: -webkit-box;
    text-overflow: ellipsis;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    overflow: hidden;
  }
  .time-shift {
    flex-shrink: 0;
    font-size: 0.9rem;
  }
</style>
