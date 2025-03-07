<script lang="ts">
  import Button from '@ya-erm/svelte-ui/Button';
  import Input from '@ya-erm/svelte-ui/Input';
  import Modal from '@ya-erm/svelte-ui/Modal';

  import { membersService } from '$lib/data';
  import { translate } from '$lib/translate';

  export let opened: boolean;

  const settings = membersService.$selectedMemberSettings;
  let currency = $settings?.currency ?? '';

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
    <div class="flex-grow grid-col-2 gap-1">
      <Button text={$translate('common.cancel')} color="secondary" onClick={handleClose} />
      <Button text={$translate('common.save')} color="primary" type="submit" />
    </div>
  </form>
</Modal>
