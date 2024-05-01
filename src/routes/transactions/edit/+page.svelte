<script lang="ts">
  import { page } from '$app/stores';

  import { translate } from '$lib/translate';
  import { useTitle } from '$lib/ui/header';
  import { getSearchParam } from '$lib/utils';

  import EditTransaction from './EditTransaction.svelte';

  useTitle($translate('transactions.edit_transaction'));

  $: id = getSearchParam($page, 'id');
</script>

<EditTransaction {id} onBack={history.back} />
