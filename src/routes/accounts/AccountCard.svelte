<script lang="ts">
  import type { AccountViewModel, CurrencyRate } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Button from '@ya-erm/svelte-ui/Button';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import { formatMoney } from '$lib/utils/formatMoney';

  export let account: AccountViewModel;
  export let balance: number | null = null;
  export let currencyRate: CurrencyRate | null = null;

  export let onEdit: (account: AccountViewModel) => void;

  const rate = currencyRate?.cur1 === account.currency ? currencyRate.rate : 1 / (currencyRate?.rate ?? 1);
  const otherCurrency = currencyRate?.cur1 === account.currency ? currencyRate.cur2 : currencyRate?.cur1;

  const handleEdit = () => {
    onEdit?.(account);
  };
</script>

<div class="w-full h-full p-1 flex-col items-center justify-between" data-testId="AccountCard">
  <div class="w-full flex items-center gap-0.5">
    <div class="account-icon flex items-center justify-center" style:background={account.color}>
      <Icon name={account.icon || 'mdi:briefcase-outline'} padding={0.5} />
    </div>
    <div class="flex-grow">
      <div class="text-ellipsis-all" data-testId="AccountName">
        {#if account.archived}
          <span class="archived" title={$translate('accounts.archived')}>
            <Icon name="ri:archive-line" size={1} />
          </span>
        {/if}
        <span>{account.name}</span>
      </div>
      <div class="account-tags">{account.tags.map((t) => `#${t.name}`).join(' ')}</div>
    </div>
    <Button appearance="link" color="white" onClick={handleEdit} title={$translate('accounts.edit_account')}>
      <Icon name="mdi:pencil" padding={0.5} />
    </Button>
  </div>
  <div class="flex-col items-center gap-0.25">
    <div class="money-value">
      {formatMoney(balance ?? 0, { currency: account.currency })}
    </div>
    {#if currencyRate && balance !== null}
      <div class="other-money-value">
        {formatMoney(balance * rate, { currency: otherCurrency })}
      </div>
    {/if}
  </div>
  <div class="flex footer"></div>
</div>

<style>
  .archived {
    font-size: 0.9rem;
    opacity: 0.5;
  }
  .account-icon {
    border-radius: 100%;
    background-color: var(--background-color);
  }
  .account-tags {
    font-size: 0.9rem;
    color: var(--secondary-text-color);
  }
  .money-value {
    font-size: 1.2rem;
  }
  .other-money-value {
    font-size: 1rem;
    color: var(--secondary-text-color);
  }
  .footer {
    min-height: 2.5rem;
  }
</style>
