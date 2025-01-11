<script lang="ts">
  import dayjs from 'dayjs';

  import Button from '@ya-erm/svelte-ui/Button';

  import type { Repeating } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';

  export let count: number;
  export let interval: Repeating['interval'];
  export let date: string | undefined = undefined;
  export let dayOfMonth: number | undefined = undefined;
  export let onDayOfMonthChangeClick: (() => void) | undefined = undefined;
</script>

{#if interval === 'day'}
  <span>
    {$translate('transactions.repeatings.every_x_days', { values: { count } })}
  </span>
{:else if interval === 'week'}
  <span>
    {$translate('transactions.repeatings.every_x_weeks', {
      values: { count, day: dayjs(date).format('dddd') },
    })}
  </span>
{:else if interval === 'month'}
  <!-- <span>
    {$translate('transactions.repeatings.every_x_day_of_month', { values: { value: dayOfMonth } })}
  </span> -->
  <span>
    {$translate('transactions.repeatings.every_x_day_of_month.every')}
  </span>
  {#if onDayOfMonthChangeClick}
    <Button
      appearance="link"
      underlined={false}
      text={$translate('transactions.repeatings.every_x_day_of_month.nth_day', { values: { value: dayOfMonth } })}
      onClick={onDayOfMonthChangeClick}
    />
  {:else}
    <span>{$translate('transactions.repeatings.every_x_day_of_month.nth_day', { values: { value: dayOfMonth } })}</span>
  {/if}

  <span>
    {$translate('transactions.repeatings.every_x_day_of_month.of_x_months', { values: { count } })}
  </span>
  <!-- <Button
    appearance="link"
    underlined={false}
    text={$translate('transactions.repeatings.every_x_day_of_month.change')}
    onClick={onDayOfMonthChangeClick}
  /> -->
{:else if interval === 'year'}
  <span>
    {$translate('transactions.repeatings.every_x_years', {
      values: { count, date: dayjs(date).format('D MMMM') },
    })}
  </span>
{/if}
