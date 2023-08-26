<script lang="ts">
  import type { Dayjs } from 'dayjs';

  import Button from '$lib/ui/Button.svelte';
  import Icon from '$lib/ui/Icon.svelte';

  export let startDate: Dayjs;
  export let endDate: Dayjs;
  export let onChange: ((startDate: Dayjs, endDate: Dayjs) => void) | null = null;

  function prevMonth() {
    startDate = startDate.subtract(1, 'month').startOf('month');
    endDate = endDate.subtract(1, 'month').endOf('month');
    onChange?.(startDate, endDate);
  }

  function nextMonth() {
    startDate = startDate.add(1, 'month').startOf('month');
    endDate = endDate.add(1, 'month').endOf('month');
    onChange?.(startDate, endDate);
  }
</script>

<div class="month-selector flex gap-1 items-center justify-between">
  <Button color="white" bordered on:click={prevMonth}>
    <Icon name="mdi:chevron-left" />
  </Button>
  <h2 class="month">{startDate.format('MMMM YYYY')}</h2>
  <Button color="white" bordered on:click={nextMonth}>
    <Icon name="mdi:chevron-right" />
  </Button>
</div>

<style>
  .month {
    margin: 0;
  }
</style>
