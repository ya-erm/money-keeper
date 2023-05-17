<script lang="ts">
  import { v4 as uuid } from 'uuid';

  import { currencyRatesService } from '$lib/data';
  import type { CurrencyRate } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import Icon from '$lib/ui/Icon.svelte';
  import Input from '$lib/ui/Input.svelte';
  import Modal from '$lib/ui/Modal.svelte';

  export let opened: boolean;
  export let item: CurrencyRate | null = null;

  let cur1 = item?.cur1 ?? '';
  let cur2 = item?.cur2 ?? '';
  let rate = `${item?.rate ?? 1}`;

  const swapCurrencies = () => {
    const tmp = cur1;
    cur1 = cur2;
    cur2 = tmp;
  };

  const onSave = async () => {
    if (!item) {
      item = {
        id: uuid(),
        cur1,
        cur2,
        rate: Number(rate),
      };
    }
    currencyRatesService.save(item);
    opened = false;
  };

  const onDelete = async () => {
    if (!item) return;
    currencyRatesService.delete(item);
    opened = false;
  };
</script>

<Modal
  header={item ? `${item.cur1} / ${item.cur2}` : $translate('currency_rates.new_currency_rate')}
  bind:opened
  width={20}
>
  <form class="flex-col gap-1 container" on:submit|preventDefault={onSave}>
    <input name="id" value={item?.id} readonly class="hidden" />
    <Input name="cur1" label={$translate('currency_rates.currency1')} bind:value={cur1} required />
    <Input name="cur2" label={$translate('currency_rates.currency2')} bind:value={cur2} required />
    <Input name="rate" label={$translate('currency_rates.rate')} type="number" step="any" bind:value={rate} required />

    <div class="flex gap-1 items-center">
      <div class="flex-grow flex-col gap-0.5">
        {#if cur1 && cur2}
          <div>1 {cur1} = {rate} {cur2}</div>
          <div>1 {cur2} = {(1 / Number(rate)).toFixed(4)} {cur1}</div>
        {/if}
      </div>
      <Button on:click={swapCurrencies} appearance="transparent" bordered>
        <Icon name="mdi:swap-vertical" />
      </Button>
    </div>

    <div class="grid-col-2 gap-1">
      {#if !!item}
        <Button on:click={onDelete} text={$translate('common.delete')} color="danger" />
      {:else}
        <Button text={$translate('common.cancel')} color="secondary" on:click={() => (opened = false)} />
      {/if}
      <Button text={$translate('common.save')} color="primary" type="submit" />
    </div>
  </form>
</Modal>
