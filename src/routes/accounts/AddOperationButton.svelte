<script lang="ts">
  import { page } from '$app/stores';

  import Icon from '@ya-erm/svelte-ui/Icon';

  import { routes } from '$lib/routes';
  import { isWideScreen } from '$lib/ui/layout/media';
  import { getSearchParam, withSearchParams } from '$lib/utils';

  $: cardId = getSearchParam($page, 'account-card');

  $: href = $isWideScreen
    ? withSearchParams($page, { 'operation-id': 'new', accountId: cardId })
    : `${routes['transactions.create'].path}?accountId=${cardId}`;

  // TODO: use <HeaderButton> instead
</script>

<a {href}>
  <Icon name="mdi:add" padding={1} />
</a>
