<script lang="ts">
  import type { Dayjs } from 'dayjs';

  import type { DateIntervalType } from '$lib/data/interfaces';
  import Button from '$lib/ui/Button.svelte';
  import Icon from '$lib/ui/Icon.svelte';
  import DateIntervalModal from './DateIntervalModal.svelte';
  import { intervalEndStore, intervalStartStore, intervalTypeStore } from './store';

  $: intervalType = $intervalTypeStore;

  export let startDate: Dayjs;
  export let endDate: Dayjs;
  export let onChange: (value: { startDate: Dayjs; endDate: Dayjs }) => void;

  const handleChange = (value: { intervalType: DateIntervalType; startDate: Dayjs; endDate: Dayjs }) => {
    intervalTypeStore.set(value.intervalType);
    intervalStartStore.set(value.startDate.format());
    intervalEndStore.set(value.endDate.format());
    onChange(value);
  };

  let opened = false;

  function prevMonth() {
    startDate = startDate.subtract(1, 'month').startOf('month');
    endDate = endDate.subtract(1, 'month').endOf('month');
    onChange({ startDate, endDate });
  }

  function nextMonth() {
    startDate = startDate.add(1, 'month').startOf('month');
    endDate = endDate.add(1, 'month').endOf('month');
    onChange({ startDate, endDate });
  }
</script>

<div class="month-selector flex gap-1 items-center justify-between">
  {#if intervalType !== 'custom'}
    <Button color="white" bordered on:click={prevMonth}>
      <Icon name="mdi:chevron-left" />
    </Button>
  {/if}
  <div class="flex-1 flex-col">
    <Button color="white" appearance="transparent" on:click={() => (opened = true)}>
      <h2 class="m-0">
        {#if intervalType === 'custom'}
          {startDate.format('DD.MM.YYYY')} - {endDate.format('DD.MM.YYYY')}
        {:else}
          {startDate.format('MMMM YYYY')}
        {/if}
      </h2>
    </Button>
  </div>
  {#if intervalType !== 'custom'}
    <Button color="white" bordered on:click={nextMonth}>
      <Icon name="mdi:chevron-right" />
    </Button>
  {/if}
</div>

<DateIntervalModal bind:opened {intervalType} {startDate} {endDate} onChange={handleChange} />
