<script lang="ts">
  import dayjs, { type Dayjs } from 'dayjs';

  import Button from '@ya-erm/svelte-ui/Button';
  import Input from '@ya-erm/svelte-ui/Input';
  import MultiSwitch from '@ya-erm/svelte-ui/MultiSwitch';

  import type { DateIntervalType } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Modal from '$lib/ui/Modal.svelte';

  export let opened = false;

  export let intervalType: DateIntervalType;
  export let startDate: Dayjs;
  export let endDate: Dayjs;
  export let onChange: (value: { intervalType: DateIntervalType; startDate: Dayjs; endDate: Dayjs }) => void;

  const options = [
    { id: 'month', title: $translate('analytics.categories.monthly_interval') },
    { id: 'custom', title: $translate('analytics.categories.custom_interval') },
  ];

  let selectedIntervalType = intervalType;
  $: selected = options.find((item) => item.id === selectedIntervalType);

  const handleTypeChange = ({ id }: { id: string }) => {
    selectedIntervalType = id as DateIntervalType;
  };

  const handleCancel = () => {
    opened = false;
  };

  const handleAccept = () => {
    opened = false;
    onChange({
      intervalType: selectedIntervalType as DateIntervalType,
      startDate,
      endDate,
    });
  };
</script>

<Modal bind:opened width={20}>
  <form class="flex-col gap-1">
    <MultiSwitch {options} {selected} onChange={handleTypeChange} />
    <Input
      type="date"
      label={$translate('analytics.categories.start_date')}
      value={startDate.format('YYYY-MM-DD')}
      onChange={(value) => (startDate = dayjs(value))}
      disabled={selectedIntervalType !== 'custom'}
    />
    <Input
      type="date"
      label={$translate('analytics.categories.end_date')}
      value={endDate.format('YYYY-MM-DD')}
      onChange={(value) => (endDate = dayjs(value))}
      disabled={selectedIntervalType !== 'custom'}
    />
    <div class="grid-col-2 gap-1">
      <Button text={$translate('common.cancel')} color="secondary" onClick={handleCancel} />
      <Button text={$translate('common.save')} color="primary" onClick={handleAccept} />
    </div>
  </form>
</Modal>
