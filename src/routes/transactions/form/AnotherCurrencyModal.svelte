<script lang="ts">
  import Button from '@ya-erm/svelte-ui/Button';
  import Input from '@ya-erm/svelte-ui/Input';

  import { memberSettingsStore, membersService } from '$lib/data';
  import { translate } from '$lib/translate';
  import Modal from '$lib/ui/Modal.svelte';

  $: settings = $memberSettingsStore;

  export let opened: boolean;
  export let anotherCurrency: string | null;
</script>

<Modal bind:opened>
  <form
    class="flex-col gap-1"
    on:submit|preventDefault={async (e) => {
      anotherCurrency = new FormData(e.currentTarget).get('another-currency')?.toString() ?? null;
      if (anotherCurrency !== settings?.lastAnotherCurrency) {
        await membersService.updateSettings({ lastAnotherCurrency: anotherCurrency });
      }
      opened = false;
    }}
  >
    <Input
      label={$translate('transactions.another_currency')}
      value={anotherCurrency}
      name="another-currency"
      clearable
    />
    <div class="grid-col-2 gap-1">
      <Button
        color="secondary"
        text={$translate('common.cancel')}
        onClick={() => {
          opened = false;
          anotherCurrency = null;
        }}
      />
      <Button text={$translate('common.save')} color="primary" type="submit" />
    </div>
  </form>
</Modal>
