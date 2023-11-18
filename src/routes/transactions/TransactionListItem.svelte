<script lang="ts">
  import type { CurrencyRate, TransactionViewModel } from '$lib/data/interfaces';
  import { translate, type Messages } from '$lib/translate';
  import Icon from '$lib/ui/Icon.svelte';
  import { replaceCalcExpressions } from '$lib/utils/calc';
  import { formatMoney } from '$lib/utils/formatMoney';

  export let transaction: TransactionViewModel;
  export let currencyRate: CurrencyRate | null = null;
  export let hideAccount: boolean = false;
  export let onClick: ((transaction: TransactionViewModel) => void) | null = null;

  const incoming = transaction.category.type === 'IN';
  const outgoing = transaction.category.type === 'OUT';
  const isTransfer = !!transaction.linkedTransaction;

  const categoryName = transaction.category.name.startsWith('system.category')
    ? $translate(transaction.category.name as Messages)
    : transaction.category.name;

  $: rate = currencyRate?.cur1 === transaction.account.currency ? currencyRate.rate : 1 / (currencyRate?.rate ?? 1);
  $: otherCurrency = currencyRate?.cur1 === transaction.account.currency ? currencyRate.cur2 : currencyRate?.cur1;

  const handleClick = () => {
    onClick?.(transaction);
  };
</script>

<li>
  <button
    data-testId="TransactionListItem"
    data-id={transaction.id}
    on:click={handleClick}
    class="flex gap-0.5 items-center justify-between"
  >
    <div class="icon flex-center">
      <Icon name={transaction.category.icon || 'mdi:folder-outline'} size={1.75} padding={0.75} />
    </div>
    <div class="text flex-col flex-grow items-start">
      <div class="flex items-center header">
        {#if isTransfer}
          <span class="source">
            {outgoing ? transaction.account.name : transaction.linkedTransaction?.account?.name}
          </span>
          <Icon name="mdi:chevron-right" size={1.25} />
          <span class="destination">
            {incoming ? transaction.account.name : transaction.linkedTransaction?.account?.name}
          </span>
        {:else}
          {#if (outgoing && !hideAccount) || incoming}
            <span class="source">
              {outgoing ? transaction.account.name : categoryName}
            </span>
          {/if}
          {#if !hideAccount}
            <Icon name="mdi:chevron-right" size={1.25} />
          {/if}
          {#if (incoming && !hideAccount) || outgoing}
            <span class="destination">
              {incoming ? transaction.account.name : categoryName}
            </span>
          {/if}
        {/if}
      </div>
      {#if transaction.comment}
        <div class="comment small-text">
          {replaceCalcExpressions(transaction.comment)}
        </div>
      {/if}
      {#if transaction.tags?.length}
        <div class="tags">
          {transaction.tags.map((t) => `#${t.name}`).join(' ')}
        </div>
      {/if}
    </div>
    <div class="flex-col items-end">
      {#if !!transaction.anotherCurrencyAmount}
        <span class="other-money-value">
          {formatMoney(transaction.anotherCurrencyAmount, { currency: transaction.anotherCurrency ?? undefined })}
        </span>
      {/if}
      <span class="amount" class:incoming class:outgoing>
        <span>{incoming ? '+' : outgoing ? '-' : ''}{formatMoney(transaction.amount)}</span>
        <span class="small-text">{transaction.account.currency}</span>
      </span>
      {#if currencyRate}
        <span class="other-money-value">
          {formatMoney(transaction.amount * rate, { currency: otherCurrency })}
        </span>
      {/if}
    </div>
  </button>
</li>

<style>
  button {
    padding: 0;
    font-size: 1rem;
    border-radius: 1rem;
    background: transparent;
    color: var(--primary-text-color);
    cursor: pointer;
    border: none;
    width: 100%;
  }
  @media (hover: hover) {
    button:hover {
      opacity: 0.9;
    }
    button:hover .icon,
    button:hover .text,
    button:hover .tags,
    button:hover .amount {
      color: var(--active-color);
    }
  }
  .header {
    font-weight: 500;
  }
  .icon {
    border-radius: 100%;
    background-color: var(--header-background-color);
  }
  .text {
    overflow: hidden;
    text-align: left;
  }
  .small-text {
    font-size: 0.9rem;
  }
  .tags {
    font-size: 0.85rem;
    color: var(--secondary-text-color);
  }
  .source,
  .comment,
  .destination {
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    max-width: 100%;
  }
  .amount {
    white-space: nowrap;
  }
  .other-money-value {
    opacity: 0.8;
    font-size: 0.75rem;
    color: var(--secondary-text-color);
  }
  .incoming {
    color: var(--green-color);
  }
  .outgoing {
    color: var(--red-color);
  }
</style>
