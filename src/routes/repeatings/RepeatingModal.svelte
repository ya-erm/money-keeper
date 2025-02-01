<script lang="ts">
  import dayjs from 'dayjs';
  import { v4 as uuid } from 'uuid';

  import Button from '@ya-erm/svelte-ui/Button';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import Input from '@ya-erm/svelte-ui/Input';
  import InputLabel from '@ya-erm/svelte-ui/InputLabel';
  import Modal from '@ya-erm/svelte-ui/Modal';
  import Portal from '@ya-erm/svelte-ui/Portal';

  import type { Repeating, TransactionViewModel } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Layout from '$lib/ui/Layout.svelte';
  import Select from '$lib/ui/Select.svelte';
  import { checkNumberFormParameter } from '$lib/utils/checkFormParams';

  import GroupedOperationsList from '../accounts/GroupedOperationsList.svelte';
  import RepeatingIntervalText from './RepeatingIntervalText.svelte';

  export let opened: boolean;
  export let date: string | undefined;
  export let repeating: Repeating | undefined = undefined;
  export let operations: TransactionViewModel[] | undefined = undefined;
  export let onSubmit: (value: Repeating) => void;
  export let onCancel: () => void;

  let count = repeating?.count ?? 1;
  let interval: Repeating['interval'] = repeating?.interval ?? 'month';
  let dayOfMonth = repeating?.dayOfMonth ?? dayjs(date).date();
  let endDate = repeating?.endDate;

  $: options = [
    { id: 'day', title: $translate('transactions.repeatings.interval.day', { values: { count } }) },
    { id: 'week', title: $translate('transactions.repeatings.interval.week', { values: { count } }) },
    { id: 'month', title: $translate('transactions.repeatings.interval.month', { values: { count } }) },
    { id: 'year', title: $translate('transactions.repeatings.interval.year', { values: { count } }) },
  ];

  let dayOfMonthModalOpened = false;

  const handleDayOfMonthSubmit = (e: Event) => {
    const formData = new FormData(e.target as HTMLFormElement);
    dayOfMonth = checkNumberFormParameter(formData, 'dayOfMonth');
    dayOfMonthModalOpened = false;
  };

  let operationsListVisible = false;

  const handleSubmit = () => {
    onSubmit({
      id: repeating?.id ?? uuid(),
      count,
      interval,
      dayOfMonth,
      endDate: endDate || undefined,
    });
  };
</script>

<Modal
  width={20}
  opened={opened && !operationsListVisible}
  header={$translate('transactions.repeatings.title')}
  onClose={onCancel}
>
  <form class="flex-col gap-1" on:submit|preventDefault={handleSubmit}>
    <div class="flex-col gap-0.5">
      <InputLabel text={$translate('transactions.repeatings.interval')} />
      <div class="grid-col-2 gap-1">
        <Input
          type="number"
          step={1}
          min={1}
          value={count.toString()}
          onChange={(value) => (count = value ? parseInt(value) : 1)}
          align="center"
          required
        />
        <Select bind:selected={interval} {options} align="center" />
      </div>
      <div class="info flex items-center gap-0.25">
        <RepeatingIntervalText
          {date}
          {count}
          {interval}
          {dayOfMonth}
          onDayOfMonthChangeClick={() => (dayOfMonthModalOpened = true)}
        />
      </div>
    </div>
    <Input label={$translate('transactions.repeatings.end_date')} type="date" bind:value={endDate} clearable />
    {#if operations?.length}
      <Button appearance="link" underlined={false} onClick={() => (operationsListVisible = true)}>
        <span>{$translate('transactions.repeatings.operations_list')}</span>
        <Icon name="mdi:chevron-right" />
      </Button>
    {/if}
    <slot />
    <div class="grid-col-2 gap-1">
      <Button color="secondary" text={$translate('common.cancel')} onClick={onCancel} />
      <Button text={$translate('common.save')} color="primary" type="submit" />
    </div>
  </form>

  <Modal bind:opened={dayOfMonthModalOpened} header={$translate('transactions.repeatings.day_of_month.title')}>
    <form class="flex-col gap-1" on:submit|preventDefault={handleDayOfMonthSubmit}>
      <div class="flex-col gap-0.5">
        <Input name="dayOfMonth" type="number" min={1} max={31} value={dayOfMonth.toString()} required />
        <span class="info">{$translate('transactions.repeatings.day_of_month.info')}</span>
      </div>
      <div class="grid-col-2 gap-1">
        <Button color="secondary" text={$translate('common.cancel')} onClick={() => (dayOfMonthModalOpened = false)} />
        <Button text={$translate('common.apply')} color="primary" type="submit" />
      </div>
    </form>
  </Modal>
</Modal>

<Portal visible={operationsListVisible}>
  <Layout
    header={{
      title: $translate('repeatings.operations'),
      backButton: {
        title: $translate('common.back'),
        onClick: () => (operationsListVisible = false),
      },
      leftButton: null,
      rightButton: null,
    }}
    hideMenu
  >
    <div class="p-1">
      <GroupedOperationsList operations={operations ?? []} />
    </div>
  </Layout>
</Portal>

<style>
  .info {
    font-size: 0.9rem;
    color: var(--secondary-text-color);
    height: 1.25rem;
  }
</style>
