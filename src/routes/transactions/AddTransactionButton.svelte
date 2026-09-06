<script lang="ts">
  import { page } from '$app/stores';

  import { route } from '$lib/routes';
  import { translate } from '$lib/translate';
  import HeaderButton from '$lib/ui/layout/HeaderButton.svelte';
  import { isWideScreen } from '$lib/ui/layout/media';
  import { withSearchParams } from '$lib/utils';

  $: href = $isWideScreen ? withSearchParams($page, { 'operation-id': 'new' }) : route('transactions.create');
</script>

<HeaderButton icon="mdi:plus" {href} label={$translate('transactions.create_transaction')} />
