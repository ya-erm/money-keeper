<script lang="ts">
  import { page } from '$app/stores';

  import { translate } from '$lib/translate';
  import HeaderFormSubmitButton from '$lib/ui/layout/HeaderFormSubmitButton.svelte';
  import Layout from '$lib/ui/layout/Layout.svelte';
  import { getSearchParam } from '$lib/utils';

  import EditTransaction from './EditTransaction.svelte';

  $: id = getSearchParam($page, 'id');
</script>

<Layout title={$translate('transactions.edit_transaction')} rightSlot={HeaderFormSubmitButton}>
  <EditTransaction {id} onBack={history.back} />
</Layout>
