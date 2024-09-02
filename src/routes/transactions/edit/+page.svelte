<script lang="ts">
  import { page } from '$app/stores';

  import { translate } from '$lib/translate';
  import { useRightButton, useTitle } from '$lib/ui/header';
  import { getSearchParam } from '$lib/utils';

  import EditTransaction from './EditTransaction.svelte';
  import SaveTransactionButton from './SaveTransactionButton.svelte';

  useTitle($translate('transactions.edit_transaction'));
  useRightButton(SaveTransactionButton);

  $: id = getSearchParam($page, 'id');
</script>

<EditTransaction {id} onBack={history.back} />
