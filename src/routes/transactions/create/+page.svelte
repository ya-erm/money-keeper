<script lang="ts">
  import { translate } from '$lib/translate';
  import HeaderBackButton from '$lib/ui/layout/HeaderBackButton.svelte';
  import HeaderFormSubmitButton from '$lib/ui/layout/HeaderFormSubmitButton.svelte';
  import Layout from '$lib/ui/layout/Layout.svelte';

  import CreateTransaction from './CreateTransaction.svelte';
</script>

<Layout
  title={$translate('transactions.new_transaction')}
  leftSlot={HeaderBackButton}
  rightSlot={HeaderFormSubmitButton}
  hideMenu
>
  <CreateTransaction onDone={() => history.back()} />
</Layout>
