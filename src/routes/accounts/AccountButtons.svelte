<script lang="ts">
  import { page } from '$app/stores';
  import { route } from '$lib/routes';
  import { translate } from '$lib/translate';
  import HeaderButton from '$lib/ui/layout/HeaderButton.svelte';

  $: createUrl = (() => {
    const url = new URL($page.url);
    url.searchParams.set('action', 'create');
    return url.toString();
  })();
</script>

<div class="flex">
  <HeaderButton icon="mdi:format-list-bulleted" label={$translate('accounts.list')} href={route('accounts.list')} />
  <HeaderButton icon="mdi:credit-card-plus-outline" label={$translate('accounts.create_account')} href={createUrl} />
</div>
