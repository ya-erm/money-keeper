<script lang="ts">
  import dayjs from 'dayjs';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import HiddenMoney from '#lib/ui/HiddenMoney.svelte';
  import { translate } from '#lib/translate/index.js';
  import type { Messages } from '#lib/translate/messages.js';
  import type { DebtEntry } from './calculations';
  import { formatDebtMoney } from './formatMoney';

  export let entries: DebtEntry[];
  export let hidden = false;
  export let onOpenOperation: (id: string) => void;
  export let onEditRecord: (id: string) => void;
  const entryLabels: Record<DebtEntry['kind'], Messages> = {
    record: 'debts.debt',
    expense: 'debts.expense',
    loan: 'debts.loan',
    repayment: 'debts.repayment',
    payment: 'debts.payment',
  };
  $: groups = entries.reduce((result: Record<string, DebtEntry[]>, entry) => {
    const date = dayjs(entry.date).format('YYYY-MM-DD');
    (result[date] ??= []).push(entry);
    return result;
  }, {});
  const categoryName = (entry: DebtEntry) =>
    entry.category?.name.startsWith('system.category')
      ? $translate(entry.category.name as Messages)
      : entry.category?.name;
</script>

<div class="history">
  {#each Object.entries(groups) as [date, dayEntries] (date)}
    <section class="day" data-testId="DebtHistoryGroup" data-date={date}>
      <h3 class="day-header" data-testId="DebtHistoryDate">{dayjs(date).format('DD MMMM YYYY')}</h3>
      <ul>
        {#each dayEntries as entry (entry.id)}
          {@const category = categoryName(entry)}
          {@const icon =
            entry.category?.icon || (entry.operationId ? 'mdi:folder-outline' : 'mdi:account-cash-outline')}
          <li>
            <button
              type="button"
              class="entry"
              data-testId="DebtHistoryEntry"
              on:click={() => (entry.operationId ? onOpenOperation(entry.operationId) : onEditRecord(entry.id))}
            >
              <span class="entry-icon" data-testId="DebtHistoryIcon" data-icon={icon} aria-hidden="true"
                ><Icon name={icon} size={1.75} padding={0.75} /></span
              >
              <div class="entry-main">
                <div class="entry-head">
                  <span class="entry-title">{category || $translate(entryLabels[entry.kind])}</span><span
                    class="entry-amount"
                    >{#if hidden}<HiddenMoney currency={entry.currency} size="sm" />{:else}{entry.amount > 0
                        ? '+'
                        : '−'}{formatDebtMoney(Math.abs(entry.amount), { currency: entry.currency })}{/if}</span
                  >
                </div>
                {#if entry.comment}<div class="entry-comment">{entry.comment}</div>{/if}
                <div class="caption">
                  {#if entry.operationId}{entry.accountName ?? ''}{:else}({$translate('debts.no_operation')}){/if}
                  {#if entry.dueDate}<span class="due-date"
                      >· {$translate('debts.due')}: {dayjs(entry.dueDate).format('D MMM YYYY')}</span
                    >{/if}
                </div>
              </div>
            </button>
          </li>
        {/each}
      </ul>
    </section>
  {:else}<p class="caption">{$translate('debts.empty_history')}</p>{/each}
</div>

<style>
  .history {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .day {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .day-header {
    margin: 0;
    font-size: 1rem;
    font-weight: 400;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .entry {
    width: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .entry-icon {
    display: flex;
    flex-shrink: 0;
    border-radius: 50%;
    background: var(--header-background-color);
  }
  .entry-main {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }
  .entry-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.5rem;
  }
  .entry-title {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .entry-amount {
    flex-shrink: 0;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  .caption {
    color: var(--secondary-text-color);
    font-size: 0.85rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin: 0;
  }
  .entry-comment {
    font-size: 0.9rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .due-date {
    margin-left: 0.25rem;
  }
</style>
