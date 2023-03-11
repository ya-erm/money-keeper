<script lang="ts">
  import { invalidate } from '$app/navigation';
  import type { CurrencyRate } from '@prisma/client';
  import type { ActionResult } from '@sveltejs/kit';

  import { deps } from '$lib/deps';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import FormContainer from '$lib/ui/FormContainer.svelte';
  import Input from '$lib/ui/Input.svelte';
  import Modal from '$lib/ui/Modal.svelte';
  import { showErrorToast, showSuccessToast } from '$lib/ui/toasts';

  export let opened: boolean;
  export let item: CurrencyRate | null = null;

  let cur1 = item?.cur1 ?? '';
  let cur2 = item?.cur2 ?? '';
  let rate = `${item?.rate ?? 1}`;

  const onSave = async (result: ActionResult) => {
    if (result.type === 'success') {
      await invalidate(deps.currencyRates);
      showSuccessToast($translate('common.save_changes_success'));
      opened = false;
    } else {
      showErrorToast($translate('common.save_changes_failure'));
    }
  };

  const onDelete = async (result: ActionResult) => {
    if (result.type === 'success') {
      await invalidate(deps.currencyRates);
      showSuccessToast($translate('currency_rates.delete_currency_rate_success'));
      opened = false;
    } else {
      showErrorToast($translate('currency_rates.delete_currency_rate_failure'));
    }
  };
</script>

<Modal
  header={item ? `${item.cur1} / ${item.cur2}` : $translate('currency_rates.new_currency_rate')}
  bind:opened
  width={20}
>
  <div class="flex-col gap-1">
    <FormContainer action={!item ? '?/create' : '?/update'} onResult={onSave}>
      <input name="id" value={item?.id} readonly class="hidden" />
      <Input name="cur1" label={$translate('currency_rates.currency1')} bind:value={cur1} />
      <Input name="cur2" label={$translate('currency_rates.currency2')} bind:value={cur2} />
      <Input name="rate" label={$translate('currency_rates.rate')} type="number" bind:value={rate} />

      {#if cur1 && cur2}
        <div>1 {cur1} = {rate} {cur2}</div>
        <div>1 {cur2} = {(1 / Number(rate)).toFixed(4)} {cur1}</div>
      {/if}

      {#if !!item}
        <FormContainer action="?/delete" onResult={onDelete}>
          <input name="id" value={item?.id} readonly class="hidden" />
          <Button
            text={$translate('currency_rates.delete_currency_rate')}
            appearance="transparent"
            color="danger"
            type="submit"
          />
        </FormContainer>
      {/if}

      <div class="grid-col-2 gap-1">
        <Button text={$translate('common.cancel')} color="secondary" on:click={() => (opened = false)} />
        <Button text={$translate('common.save')} color="primary" type="submit" />
      </div>
    </FormContainer>
  </div>
</Modal>
