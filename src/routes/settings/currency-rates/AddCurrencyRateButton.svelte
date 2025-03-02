<script lang="ts">
  import { translate } from '$lib/translate';
  import HeaderButton from '$lib/ui/layout/HeaderButton.svelte';
</script>

<HeaderButton icon="mdi:plus" href="?action=create" label={$translate('currency_rates.new_currency_rate')} />
