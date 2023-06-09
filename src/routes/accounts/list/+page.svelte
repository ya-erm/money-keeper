<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { accountsStore } from '$lib/data';
  import type { Account } from '$lib/data/interfaces';
  import { route } from '$lib/routes';
  import { translate } from '$lib/translate';
  import { backLink, useRightButton, useTitle } from '$lib/ui/header/model';
  import { deleteSearchParam, getSearchParam } from '$lib/utils';

  import AccountModal from '../AccountModal.svelte';
  import AccountList from './AccountList.svelte';
  import AddAccountButton from './AddAccountButton.svelte';

  $: accounts = $accountsStore;

  backLink.set(route('accounts'));
  useRightButton(AddAccountButton);
  useTitle($translate('accounts.title'));

  let opened = false;

  $: action = getSearchParam($page, 'action');

  $: if (action === 'create') {
    opened = true;
  }
  $: if (!!action && !opened) {
    deleteSearchParam($page, 'action');
  }

  const onClick = async (item: Account) => {
    await goto(`${route('accounts')}?account-card=${item.id}`);
  };
</script>

<AccountList {accounts} {onClick} />

{#if opened}
  <AccountModal account={null} bind:opened />
{/if}
