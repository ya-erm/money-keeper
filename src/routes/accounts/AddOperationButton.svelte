<script lang="ts">
  import { page } from '#lib/page.js';

  import Icon from '@ya-erm/svelte-ui/Icon';

  import { routes } from '#lib/routes.js';
  import { isWideScreen } from '#lib/ui/layout/media.js';
  import { getSearchParam, withSearchParams } from '#lib/utils/index.js';

  $: cardId = getSearchParam($page, 'account-card');

  $: href = $isWideScreen
    ? withSearchParams($page, { 'operation-id': 'new', accountId: cardId })
    : `${routes['transactions.create'].path}?accountId=${cardId}`;

  // TODO: use <HeaderButton> instead
</script>

<a {href}><Icon name="mdi:add" padding={1} /></a>
