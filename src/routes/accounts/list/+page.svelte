<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { accountsStore } from '$lib/data';
  import type { Account } from '$lib/data/interfaces';
  import { route } from '$lib/routes';
  import { translate } from '$lib/translate';
  import { useBackButton, useRightButton, useTitle } from '$lib/ui/header/model';
  import { deleteSearchParam, getSearchParam } from '$lib/utils';

  import AccountModal from '../AccountModal.svelte';
  import AccountList from './AccountList.svelte';
  import AccountListButtons from './AccountListButtons.svelte';

  $: accounts = $accountsStore;

  useBackButton(route('accounts'), $translate('common.back'));
  useTitle($translate('accounts.title'));
  useRightButton(AccountListButtons);

  let opened = false;

  $: action = getSearchParam($page, 'action');

  $: if (action === 'create') {
    opened = true;
  }
  $: if (action === 'create' && !opened) {
    deleteSearchParam($page, 'action');
  }

  $: sortable = action === 'sort';

  $: if (action === 'sort' && !sortable) {
    goto('?', { replaceState: true });
  }

  const onClick = async (item: Account) => {
    await goto(`${route('accounts')}?account-card=${item.id}`);
  };
</script>

<AccountList {accounts} {onClick} bind:sortable />

{#if opened}
  <AccountModal account={null} bind:opened />
{/if}
