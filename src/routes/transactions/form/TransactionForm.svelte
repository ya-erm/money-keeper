<script lang="ts">
  import dayjs from 'dayjs';
  import { v4 as uuid } from 'uuid';
  import { page } from '$app/stores';

  import Button from '@ya-erm/svelte-ui/Button';
  import Checkbox from '@ya-erm/svelte-ui/Checkbox';
  import Input from '@ya-erm/svelte-ui/Input';
  import InputLabel from '@ya-erm/svelte-ui/InputLabel';

  import { memberSettingsStore, operationTagsService } from '$lib/data';
  import { SYSTEM_CATEGORY_TRANSFER_IN, SYSTEM_CATEGORY_TRANSFER_OUT } from '$lib/data/categories';
  import type { AccountViewModel, Category, Tag, Transaction, TransactionViewModel } from '$lib/data/interfaces';
  import { operationsCommentsStore } from '$lib/data/operations';
  import { repeatingsService, repeatingsStore } from '$lib/data/repeatings';
  import { translate } from '$lib/translate';
  import Layout from '$lib/ui/Layout.svelte';
  import Portal from '$lib/ui/Portal.svelte';
  import Spoiler from '$lib/ui/Spoiler.svelte';
  import SpoilerToggle from '$lib/ui/SpoilerToggle.svelte';
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

  import RepeatingModal from '../../repeatings/RepeatingModal.svelte';
  import RepeatingsList from '../../repeatings/RepeatingsList.svelte';
  import AccountSelector from './AccountSelector.svelte';
  import AnotherCurrencyModal from './AnotherCurrencyModal.svelte';
  import CategorySelect from './CategorySelect.svelte';
  import RepeatingTypeModal from './RepeatingTypeModal.svelte';
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

  let type = isTransfer
    ? 'TRANSFER'
    : transaction
      ? transaction.category.type
      : (getSearchParam($page, 'type') ?? 'OUT');

  let categoryId = transaction?.categoryId ?? getSearchParam($page, 'categoryId');

  let timeZone = transaction ? (transaction?.timeZone ?? undefined) : dayjs.tz.guess();
  let timeZoneShift = timeZone ? getTimeZoneOffset(timeZone) : undefined;
  let timeZoneListVisible = false;

  let date = dayjs(transaction?.date).tz(timeZone).format('YYYY-MM-DD');
  let time = dayjs(transaction?.date).tz(timeZone).format('HH:mm');
  $: datetime = timeZone ? dayjs.tz(`${date} ${time}`, timeZone).format() : dayjs(`${date} ${time}`).tz('UTC').format();

  let inputRef: HTMLInputElement | null = null;

  let accountId = isTransfer
    ? sourceTransaction?.accountId
    : (transaction?.accountId ?? getSearchParam($page, 'accountId'));
  let destinationAccountId = isTransfer
    ? destinationTransaction?.accountId
    : getSearchParam($page, 'destinationAccountId');

  $: accountCurrency = accounts.find(({ id }) => id === accountId)?.currency;
  $: destinationAccountCurrency = accounts.find(({ id }) => id === destinationAccountId)?.currency;

  let destinationAmountTouched = false;

  let _value1 = (isTransfer ? sourceTransaction?.amount : transaction?.amount)?.toString() ?? '';
  let _value2 = destinationTransaction?.amount?.toString() ?? transaction?.anotherCurrencyAmount?.toString() ?? '';
  $: _rate = Number(_value1) / Number(_value2);

  let selectingAccount = false;
  let selectingDestinationAccount = false;

  let selectedTags = transaction?.tags.map((t) => `${t.id}`) ?? [];

  let comment = transaction?.comment ?? '';

  let anotherCurrencyModalOpened = false;
  let anotherCurrency: string | null = transaction?.anotherCurrency ?? null;

  let suggestions: string[] = [];

  const comments = $operationsCommentsStore;

  const handleCommentChange = (value: string) => {
    comment = value;
    if (comment.length < 2) {
      suggestions = [];
      return;
    }
    const newSuggestions = comments.filter((item) => item.startsWith(comment)).slice(0, 3);
    if (newSuggestions.length === 1 && newSuggestions[0] === comment) {
      suggestions = [];
      return;
    }
    if (newSuggestions.join(',') !== suggestions.join(',')) {
      suggestions = newSuggestions;
    }
  };

  let additionalParametersHidden = transaction?.excludeFromAnalysis || transaction?.repeating ? false : true;

  let excludeFromAnalysis = transaction?.excludeFromAnalysis ?? false;

  let repeating = transaction?.repeating;
  let repeatingChecked = transaction?.repeating ? true : false;
  let repeatingTypeModalOpened = false;
  let repeatingListVisible = false;
  let repeatingModalOpened = false;

  const handleRepeatingCheckboxChange = (checked: boolean) => {
    if (checked && !repeating) {
      repeatingTypeModalOpened = true;
    }
  };

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

      const tagIds = selectedTags.filter((tagId) => tags.find((t) => t.id === tagId));

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
        tagIds,
        ...(anotherCurrency
          ? {
              anotherCurrency,
              anotherCurrencyAmount: checkNumberFormParameter(formData, 'destinationAmount'),
            }
          : {}),
        ...(excludeFromAnalysis ? { excludeFromAnalysis } : {}),
        ...(repeatingChecked ? { repeatingId: repeating?.id } : {}),
      });

      if (type === 'TRANSFER') {
        transactions.push({
          id: transaction?.linkedTransactionId ?? uuid(),
          accountId: checkStringFormParameter(formData, 'destinationAccountId'),
          categoryId: SYSTEM_CATEGORY_TRANSFER_IN.id,
          date: datetime,
          ...(timeZone ? { timeZone } : {}),
          amount: checkNumberFormParameter(formData, 'destinationAmount'),
          comment: checkStringOptionalFormParameter(formData, 'comment')?.trim(),
          tagIds,
          linkedTransactionId: transactions[0].id,
          ...(excludeFromAnalysis ? { excludeFromAnalysis } : {}),
          ...(repeatingChecked ? { repeatingId: repeating?.id } : {}),
        });
        transactions[0].linkedTransactionId = transactions[1].id;
      }

      if (repeating) {
        repeatingsService.save(repeating);
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
          if (!inputRef?.value) {
            inputRef?.focus({ preventScroll: true });
            inputRef?.scrollIntoView({ behavior: 'smooth' });
          }
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
        <Button appearance="link" underlined={false} onClick={() => (timeZoneListVisible = true)}>
          {#if timeZone}
            <div class="flex gap-0.25">
              <span class="time-zone text-ellipsis">{timeZone}</span>
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
              onClick={() => {
                anotherCurrencyModalOpened = true;
                anotherCurrency = settings?.lastAnotherCurrency ?? null;
              }}
            >
              {$translate('transactions.another_currency')}
            </Button>
          {:else}
            <Button appearance="link" underlined={false} onClick={() => (anotherCurrency = null)}>
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
          onChange={(value) => {
            if (type === 'TRANSFER' && accountCurrency === destinationAccountCurrency && !destinationAmountTouched) {
              _value2 = value;
            }
          }}
          endText={accountCurrency}
          required
        />
        {#if type === 'TRANSFER' || !!anotherCurrency}
          <Input
            type="number"
            name="destinationAmount"
            inputmode="decimal"
            bind:value={_value2}
            endText={destinationAccountCurrency || anotherCurrency}
            onChange={(value) => {
              destinationAmountTouched = !!value;
            }}
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
      onChange={handleCommentChange}
      list="suggestions"
      optional
    />
    <datalist id="suggestions">
      {#each suggestions as option}
        <option value={option}></option>
      {/each}
    </datalist>
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
    <div class="flex-col gap-0.5">
      <Spoiler hidden={additionalParametersHidden}>
        <SpoilerToggle slot="spoiler-header" bind:hidden={additionalParametersHidden}>
          {$translate('transactions.additional_parameters')}
        </SpoilerToggle>
        <div class="flex-col gap-1">
          <Checkbox bind:checked={excludeFromAnalysis} label={$translate('transactions.exclude_from_analytics')} />
          <div class="flex gap-1">
            <div class="flex-grow">
              <Checkbox
                bind:checked={repeatingChecked}
                onChange={handleRepeatingCheckboxChange}
                label={$translate('transactions.repeatings')}
              />
            </div>
            {#if repeatingChecked}
              <Button appearance="link" underlined={false} onClick={() => (repeatingModalOpened = true)}>
                {$translate('transactions.repeatings.configure')}
              </Button>
            {/if}
          </div>
        </div>
      </Spoiler>
    </div>
    <slot />
    <slot name="button" />
    <slot name="footer" />
  </div>
</form>

<AnotherCurrencyModal bind:opened={anotherCurrencyModalOpened} bind:anotherCurrency />

{#if repeatingTypeModalOpened}
  <RepeatingTypeModal
    bind:opened={repeatingTypeModalOpened}
    onCreateNew={() => {
      repeatingModalOpened = true;
      repeatingTypeModalOpened = false;
    }}
    onSelectExisting={() => {
      repeatingListVisible = true;
      repeatingTypeModalOpened = false;
    }}
    onCancel={() => {
      if (!repeating) repeatingChecked = false;
      repeatingTypeModalOpened = false;
    }}
  />
{/if}

{#if repeatingModalOpened}
  <RepeatingModal
    {repeating}
    date={datetime}
    opened={repeatingModalOpened}
    onSubmit={(value) => {
      repeating = value;
      repeatingModalOpened = false;
    }}
    onCancel={() => {
      if (!repeating) repeatingChecked = false;
      repeatingModalOpened = false;
    }}
  />
{/if}

<Portal visible={repeatingListVisible}>
  <Layout
    header={{
      title: $translate('transactions.repeatings.select_repeating'),
      backButton: {
        title: $translate('common.back'),
        onClick: () => {
          if (!repeating) repeatingChecked = false;
          repeatingListVisible = false;
        },
      },
      leftButton: null,
      rightButton: null,
    }}
  >
    <div class="p-1">
      <RepeatingsList
        repeatings={$repeatingsStore}
        onClick={(item) => {
          repeating = item;
          repeatingListVisible = false;
        }}
      />
    </div>
  </Layout>
</Portal>

<Portal visible={timeZoneListVisible}>
  <Layout
    header={{
      title: $translate('timezones.select_time_zone'),
      backButton: { title: $translate('common.back'), onClick: () => (timeZoneListVisible = false) },
      leftButton: null,
      rightButton: null,
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
  }
  .time-shift {
    flex-shrink: 0;
    font-size: 0.9rem;
  }
</style>
