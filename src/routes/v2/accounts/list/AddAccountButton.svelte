<script lang="ts">
  import { translate } from '$lib/translate';
  import AddButton from '$lib/ui/header/AddButton.svelte';
</script>

<AddButton label={$translate('transactions.create_transaction')} />
