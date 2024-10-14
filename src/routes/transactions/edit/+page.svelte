<script lang="ts">
  import { page } from '$app/stores';

  import { translate } from '$lib/translate';
  import { useRightButton, useTitle } from '$lib/ui/header';
  import HeaderFormSubmitButton from '$lib/ui/header/HeaderFormSubmitButton.svelte';
  import { getSearchParam } from '$lib/utils';

  import EditTransaction from './EditTransaction.svelte';

  useTitle($translate('transactions.edit_transaction'));
  useRightButton(HeaderFormSubmitButton);

  $: id = getSearchParam($page, 'id');
</script>

<EditTransaction {id} onBack={history.back} />
