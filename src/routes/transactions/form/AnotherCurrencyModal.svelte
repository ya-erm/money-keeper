<script lang="ts">
  import Button from '@ya-erm/svelte-ui/Button';
  import Input from '@ya-erm/svelte-ui/Input';
  import Modal from '@ya-erm/svelte-ui/Modal';
  import Tags from '@ya-erm/svelte-ui/Tags';

  import { memberSettingsStore, membersService, operationsStore } from '$lib/data';
  import { translate } from '$lib/translate';

  $: settings = $memberSettingsStore;

  export let opened: boolean;
  export let anotherCurrency: string | null;
  $: anotherCurrencyInputValue = anotherCurrency;

  const lastUsedCurrencies = (() => {
    const currencies = new Set<string>();
    for (const operation of $operationsStore) {
      if (operation.anotherCurrency) {
        currencies.add(operation.anotherCurrency);
        if (currencies.size === 4) break;
      }
    }
    return Array.from(currencies).map((currency) => ({ id: currency, title: currency }));
  })();
</script>

<Modal bind:opened width={18}>
  <form
    class="flex-col gap-1"
    on:submit|preventDefault={async () => {
      anotherCurrency = anotherCurrencyInputValue;
      if (anotherCurrency !== settings?.lastAnotherCurrency) {
        await membersService.updateSettings({ lastAnotherCurrency: anotherCurrency });
      }
      opened = false;
    }}
  >
    <Input
      label={$translate('transactions.another_currency')}
      bind:value={anotherCurrencyInputValue}
      name="another-currency"
      clearable
    />
    {#if lastUsedCurrencies.length > 0}
      <Tags tags={lastUsedCurrencies} selected={[]} onChange={(id) => (anotherCurrencyInputValue = id)} readOnly />
    {/if}
    <div class="grid-col-2 gap-1">
      <Button
        color="secondary"
        text={$translate('common.cancel')}
        onClick={() => {
          opened = false;
          anotherCurrency = null;
          anotherCurrencyInputValue = null;
        }}
      />
      <Button text={$translate('common.save')} color="primary" type="submit" />
    </div>
  </form>
</Modal>
