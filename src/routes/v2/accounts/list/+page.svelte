<script lang="ts">
  import { page } from '$app/stores';

  import { accountsService } from '$lib/data';
  import type { Account } from '$lib/data/interfaces';
  import { route } from '$lib/routes';
  import { translate } from '$lib/translate';
  import { backLink, useRightButton, useTitle } from '$lib/ui/header/model';
  import { deleteSearchParam, getSearchParam } from '$lib/utils';

  import AccountList from './AccountList.svelte';
  import AccountModal from './AccountModal.svelte';
  import AddAccountButton from './AddAccountButton.svelte';

  const accountsStore = accountsService.$accounts;
  $: accounts = $accountsStore;

  backLink.set(route('accounts'));
  useRightButton(AddAccountButton);
  useTitle($translate('accounts.title'));

  let account: Account | null = null;
  let opened = false;

  $: action = getSearchParam($page, 'action');
  $: if (action === 'create') {
    account = null;
    opened = true;
  }
  $: if (!!action && !opened) {
    deleteSearchParam($page, 'action');
  }

  const onClick = (item: Account) => {
    account = item;
    opened = true;
  };

  const onSave = (item: Account) => {
    accountsService.save(item);
  };

  const onDelete = (item: Account) => {
    accountsService.delete(item);
  };
</script>

<AccountList {accounts} {onClick} />

{#if opened}
  <AccountModal {account} bind:opened {onSave} {onDelete} />
{/if}
