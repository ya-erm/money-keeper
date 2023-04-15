<script lang="ts">
  import { page } from '$app/stores';

  import type { Account } from '$lib/data/interfaces';
  import { accountsService } from '$lib/data/main';
  import { translate } from '$lib/translate';
  import { useRightButton, useTitle } from '$lib/ui/header/header';
  import { deleteSearchParam, getSearchParam } from '$lib/utils';
  import { useCreateAction } from '$lib/utils/useCreateAction';

  import AccountList from './AccountList.svelte';
  import AccountModal from './AccountModal.svelte';
  import AddAccountButton from './AddAccountButton.svelte';

  const accounts = accountsService.$accounts;
  $: items = $accounts.sort((a, b) => a.order - b.order);

  // @ts-ignore
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

<AccountList accounts={items} {onClick} />

{#if opened}
  <AccountModal {account} bind:opened {onSave} {onDelete} />
{/if}
