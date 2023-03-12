<script lang="ts">
  import type { CurrencyRate } from '@prisma/client';

  import type { TransactionFullDto } from '$lib/interfaces';
  import { routes } from '$lib/routes';
  import { translate, type Messages } from '$lib/translate';
  import Icon from '$lib/ui/Icon.svelte';
  import { formatMoney } from '$lib/utils/formatMoney';

  export let transaction: TransactionFullDto;
  export let currencyRate: CurrencyRate | null = null;
  export let hideAccount: boolean = false;
  export let onClick: ((transaction: TransactionFullDto) => void) | null = null;

  const incoming = transaction.category.type === 'IN';
  const outgoing = transaction.category.type === 'OUT';
  const isTransfer = !!transaction.linkedTransaction;

  const categoryName = transaction.category.name.startsWith('system.category')
    ? $translate(transaction.category.name as Messages)
    : transaction.category.name;

  const handleClick = (e: MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(transaction);
    }
  };

  $: rate = currencyRate?.cur1 === transaction.account.currency ? currencyRate.rate : 1 / (currencyRate?.rate ?? 1);
  $: otherCurrency = currencyRate?.cur1 === transaction.account.currency ? currencyRate.cur2 : currencyRate?.cur1;
</script>

<a
  href={transaction.id ? `${routes.transactions.path}/${transaction.id}` : '#'}
  on:click={handleClick}
  class="flex-grow"
>
  <div class="flex gap-0.5 items-center justify-between">
    <div class="icon flex-center">
      <Icon name={transaction.category.icon || 'mdi:folder-outline'} size={1.75} padding={0.75} />
    </div>
    <div class="text flex-col flex-grow">
      <div class="flex items-center">
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
      <div class="small-text">
        {transaction.comment}
      </div>
      {#if transaction.tags?.length}
        <div class="tags">
          {transaction.tags.map((t) => `#${t.name}`).join(' ')}
        </div>
      {/if}
    </div>
    <div class="flex-col items-end">
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
  </div>
</a>

<style>
  a {
    text-decoration: none;
    color: inherit;
  }
  @media (hover: hover) {
    a:hover .icon,
    a:hover .text,
    a:hover .tags,
    a:hover .amount {
      color: var(--active-color);
    }
  }
  .icon {
    border-radius: 100%;
    background-color: var(--header-background-color);
  }
  .text {
    overflow: hidden;
  }
  .small-text {
    font-size: 0.9rem;
  }
  .tags {
    font-size: 0.85rem;
    color: var(--secondary-text-color);
  }
  .source,
  .destination {
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
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
