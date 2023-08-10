<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  import { translate } from '$lib/translate';
  import HeaderButton from '$lib/ui/header/HeaderButton.svelte';
  import { getSearchParam } from '$lib/utils';

  $: action = getSearchParam($page, 'action');
  const handleSortClick = async () => {
    if (action === 'sort') {
      goto('?', { replaceState: true });
    } else {
      goto('?action=sort', { replaceState: true });
    }
  };
</script>

<div class="flex">
  <HeaderButton icon="mdi:sort" label={$translate('accounts.sort')} onClick={handleSortClick} href="?action=sort" />
  <div class="button" class:button-hidden={action === 'sort'}>
    <HeaderButton
      icon="mdi:credit-card-plus-outline"
      href="?action=create"
      label={$translate('accounts.create_account')}
    />
  </div>
</div>

<style>
  .button {
    transition: width 0.5s;
    width: 56px;
  }
  .button-hidden {
    width: 0;
  }
</style>
