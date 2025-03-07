<script lang="ts">
  import { translate } from '$lib/translate';
  import HeaderBackButton from '$lib/ui/layout/HeaderBackButton.svelte';
  import Layout from '$lib/ui/layout/Layout.svelte';

  import AddCurrencyRateButton from './AddCurrencyRateButton.svelte';
  import CurrencyRatesList from './CurrencyRatesList.svelte';
</script>

<Layout title={$translate('currency_rates.title')} leftSlot={HeaderBackButton} rightSlot={AddCurrencyRateButton}>
  <div class="p-1">
    <CurrencyRatesList />
  </div>
</Layout>
