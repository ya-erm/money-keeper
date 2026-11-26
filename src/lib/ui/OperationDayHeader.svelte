<script lang="ts">
  import dayjs from 'dayjs';
  export let date: string;
  export let expenses: string[] = [];
</script>

<div class="day-header flex items-center justify-between gap-0.5">
  <span>{dayjs(date).format('DD MMMM YYYY, dddd')}</span>
  {#if expenses.length}
    <div class="day-expenses flex-col items-end" data-testId="DayExpenses">
      {#each expenses as expense (expense)}<span>{expense}</span>{/each}
    </div>
  {/if}
</div>

<style>
  .day-expenses {
    flex-shrink: 0;
    font-size: 0.8rem;
    color: var(--secondary-text-color);
    opacity: 0.6;
    white-space: nowrap;
  }
</style>
