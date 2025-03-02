<script lang="ts">
  import { route } from '$lib/routes';
  import { translate } from '$lib/translate';
  import HeaderButton from '$lib/ui/layout/HeaderButton.svelte';
</script>

<HeaderButton
  icon="mdi:plus"
  href={route('transactions.create')}
  label={$translate('transactions.create_transaction')}
/>
