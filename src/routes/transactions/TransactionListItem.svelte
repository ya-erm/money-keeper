<script lang="ts">
  import Icon from '@ya-erm/svelte-ui/Icon';

  import type { CurrencyRate, TransactionViewModel } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import type { Messages } from '$lib/translate/messages';
  import { longPress } from '$lib/utils';
  import { replaceCalcExpressions } from '$lib/utils/calc';
  import { formatMoney } from '$lib/utils/formatMoney';

  export let transaction: TransactionViewModel;
  export let currencyRate: CurrencyRate | null = null;
  export let hideAccount: boolean = false;
  export let onClick: ((transaction: TransactionViewModel) => void) | null = null;
  export let onLongPress: ((transaction: TransactionViewModel) => void) | null = null;

  $: incoming = transaction.category.type === 'IN';
  $: outgoing = transaction.category.type === 'OUT';
  $: isTransfer = !!transaction.linkedTransaction;

  $: categoryName = transaction.category.name.startsWith('system.category')
    ? $translate(transaction.category.name as Messages)
    : transaction.category.name;

  $: rate = currencyRate?.cur1 === transaction.account.currency ? currencyRate.rate : 1 / (currencyRate?.rate ?? 1);
  $: otherCurrency = currencyRate?.cur1 === transaction.account.currency ? currencyRate.cur2 : currencyRate?.cur1;

  $: transactionAccount = {
    name: transaction.account.name,
    deleted: transaction.account.deleted,
  };

  $: linkedTransactionAccountOrCategory = isTransfer
    ? {
        name: transaction.linkedTransaction?.account?.name,
        deleted: transaction.linkedTransaction?.account?.deleted,
      }
    : {
        name: categoryName,
        deleted: transaction.category.deleted,
      };

  $: source = outgoing ? transactionAccount : linkedTransactionAccountOrCategory;
  $: destination = incoming ? transactionAccount : linkedTransactionAccountOrCategory;
</script>

<li>
  <button
    data-testId="TransactionListItem"
    data-id={transaction.id}
    class:interactive={!!onClick}
    tabindex={!onClick ? -1 : undefined}
    on:click={() => onClick?.(transaction)}
    use:longPress={() => onLongPress?.(transaction)}
    class="flex gap-0.5 items-center justify-between"
  >
    <div class="icon flex-center" class:deleted={transaction.category.deleted}>
      <Icon name={transaction.category.icon || 'mdi:folder-outline'} size={1.75} padding={0.75} />
      {#if transaction.repeating}
        <div class="repeating-icon">
          <Icon name="mdi:repeat" size={1} />
        </div>
      {/if}
    </div>
    <div class="text flex-col flex-grow items-start">
      <div class="header flex items-center">
        {#if isTransfer}
          <span class="source" class:deleted={source.deleted}>{source.name}</span>
          <Icon name="mdi:chevron-right" size={1.25} />
          <span class="destination" class:deleted={destination.deleted}>{destination.name} </span>
        {:else}
          {#if (outgoing && !hideAccount) || incoming}
            <span class="source" class:deleted={source.deleted}>{source.name}</span>
          {/if}
          {#if !hideAccount}
            <Icon name="mdi:chevron-right" size={1.25} />
          {/if}
          {#if (incoming && !hideAccount) || outgoing}
            <span class="destination" class:deleted={destination.deleted}>{destination.name}</span>
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
          {#each transaction.tags as tag (tag.id)}
            <span class="tag" class:deleted={tag.deleted}>#{tag.name}</span>
          {/each}
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
  li {
    list-style: none;
  }
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
    button.interactive:hover {
      opacity: 0.9;
    }
    button.interactive:focus-visible {
      outline: 2px solid var(--active-color);
      outline-offset: 2px;
    }
    button.interactive:hover .icon,
    button.interactive:hover .text,
    button.interactive:hover .tags,
    button.interactive:hover .amount {
      color: var(--active-color);
    }
  }
  .header {
    font-weight: 500;
  }
  .deleted {
    opacity: 0.5;
    text-decoration: line-through;
  }
  .icon {
    border-radius: 100%;
    background-color: var(--header-background-color);
    position: relative;
  }
  .repeating-icon {
    position: absolute;
    bottom: 0;
    right: 0;
    border-radius: 50%;
    background: var(--background-color);
    outline: 1px solid var(--background-color);
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
  .tag:not(:last-child)::after {
    content: ' ';
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
