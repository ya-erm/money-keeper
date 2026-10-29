<script lang="ts">
  import { page } from '#lib/page.js';

  import { translate } from '#lib/translate/index.js';
  import HeaderFormSubmitButton from '#lib/ui/layout/HeaderFormSubmitButton.svelte';
  import Layout from '#lib/ui/layout/Layout.svelte';
  import { getSearchParam } from '#lib/utils/index.js';

  import EditTransaction from './EditTransaction.svelte';

  $: id = getSearchParam($page, 'id');
</script>

<Layout title={$translate('transactions.edit_transaction')} rightSlot={HeaderFormSubmitButton}
  ><EditTransaction {id} onBack={() => history.back()} /></Layout
>
