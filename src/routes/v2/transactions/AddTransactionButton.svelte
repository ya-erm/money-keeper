<script lang="ts">
  import { translate } from '$lib/translate';
  import AddButton from '$lib/ui/header/AddButton.svelte';

  // TODO: use routes
  let link = '/v2/transactions/create';
</script>

<AddButton href={link} label={$translate('transactions.create_transaction')} />
