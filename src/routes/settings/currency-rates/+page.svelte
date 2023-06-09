<script lang="ts">
  import { membersService } from '$lib/data';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import Input from '$lib/ui/Input.svelte';
  import { showSuccessToast } from '$lib/ui/toasts';

  import CurrencyRatesList from './CurrencyRatesList.svelte';

  const settings = membersService.$selectedMemberSettings;
  let currency = $settings?.currency ?? '';

  const handleSaveCurrency = () => {
    membersService.updateSettings({ currency });
    showSuccessToast($translate('common.save_changes_success'));
  };
</script>

<div class="p-1 flex-col gap-1">
  <form class="flex gap-0.5 items-end" on:submit|preventDefault={handleSaveCurrency}>
    <Input name="currency" label={$translate('currency_rates.default_currency')} bind:value={currency} />
    <Button text={$translate('common.save')} type="submit" />
  </form>
  <CurrencyRatesList />
</div>
