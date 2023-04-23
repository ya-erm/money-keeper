<script lang="ts">
  import { translate } from '$lib/translate';
  import HeaderButton from '$lib/ui/header/HeaderButton.svelte';
</script>

<HeaderButton icon="mdi:plus" href="?action=create" label={$translate('transactions.create_transaction')} />
