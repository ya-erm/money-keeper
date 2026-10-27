<script lang="ts">
  import { page } from '#lib/page.js';

  import { route } from '#lib/routes.js';
  import { translate } from '#lib/translate/index.js';
  import HeaderButton from '#lib/ui/layout/HeaderButton.svelte';
  import { isWideScreen } from '#lib/ui/layout/media.js';
  import { withSearchParams } from '#lib/utils/index.js';

  $: href = $isWideScreen ? withSearchParams($page, { 'operation-id': 'new' }) : route('transactions.create');
</script>

<HeaderButton icon="mdi:plus" {href} label={$translate('transactions.create_transaction')} />
