<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '#lib/page.js';

  import { accountsStore } from '#lib/data/index.js';
  import type { Account } from '#lib/data/interfaces.js';
  import { route } from '#lib/routes.js';
  import { translate } from '#lib/translate/index.js';
  import HeaderBackButton from '#lib/ui/layout/HeaderBackButton.svelte';
  import Layout from '#lib/ui/layout/Layout.svelte';
  import { deleteSearchParam, getSearchParam } from '#lib/utils/index.js';

  import AccountModal from '../AccountModal.svelte';
  import AccountList from './AccountList.svelte';
  import AccountListButtons from './AccountListButtons.svelte';

  $: accounts = $accountsStore;

  let opened = false;

  $: action = getSearchParam($page, 'action');

  $: if (action === 'create') {
    opened = true;
  }
  $: if (action === 'create' && !opened) {
    void deleteSearchParam($page, 'action');
  }

  $: sortable = action === 'sort';

  $: if (action === 'sort' && !sortable) {
    void goto('?', { replace: true });
  }

  const onClick = async (item: Account) => {
    await goto(`${route('accounts')}?account-card=${item.id}`);
  };
</script>

<Layout title={$translate('accounts.title')} leftSlot={HeaderBackButton} rightSlot={AccountListButtons}>
  <AccountList {accounts} {onClick} bind:sortable />
</Layout>

{#if opened}
  <AccountModal account={null} bind:opened />
{/if}
