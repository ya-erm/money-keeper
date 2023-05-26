<script lang="ts">
  import { page } from '$app/stores';

  import { routes } from '$lib/routes';
  import Icon from '$lib/ui/Icon.svelte';
  import { getSearchParam } from '$lib/utils';

  $: cardId = getSearchParam($page, 'account-card');
</script>

<a href={`${routes['transactions.create'].path}?accountId=${cardId}`}>
  <Icon name="mdi:add" padding={1} />
</a>
