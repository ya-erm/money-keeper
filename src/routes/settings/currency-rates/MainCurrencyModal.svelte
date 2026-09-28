<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';

  import Button from '@ya-erm/svelte-ui/Button';
  import Input from '@ya-erm/svelte-ui/Input';
  import Modal from '@ya-erm/svelte-ui/Modal';
  import Tags from '@ya-erm/svelte-ui/Tags';

  import { accountsStore, membersService } from '$lib/data';
  import { translate } from '$lib/translate';

  export let opened: boolean;

  const settings = membersService.$selectedMemberSettings;
  let currency = $settings?.currency ?? '';

  const accountCurrencies = (() => {
    const currencies = new SvelteSet<string>();
    for (const account of $accountsStore) {
      currencies.add(account.currency);
      if (currencies.size === 4) break;
    }
    return Array.from(currencies).map((accountCurrency) => ({ id: accountCurrency, title: accountCurrency }));
  })();

  const handleClose = () => {
    opened = false;
  };

  const handleSaveCurrency = async () => {
    await membersService.updateSettings({ currency });
    opened = false;
  };
</script>

<Modal id="main-currency-modal" header={$translate('currency_rates.default_currency')} {opened} onClose={handleClose}>
  <form class="flex-col gap-1" on:submit|preventDefault={handleSaveCurrency}>
    <Input name="currency" bind:value={currency} />
    {#if accountCurrencies.length > 0}
      <Tags tags={accountCurrencies} selected={[]} onChange={(id) => (currency = id)} readOnly />
    {/if}
    <div class="flex-grow grid-col-2 gap-1">
      <Button text={$translate('common.cancel')} color="secondary" onClick={handleClose} />
      <Button text={$translate('common.save')} color="primary" type="submit" />
    </div>
  </form>
</Modal>
