<script lang="ts">
  import { page } from '$app/stores';

  import { accountsStore } from '$lib/data';
  import type { AccountViewModel } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Layout from '$lib/ui/layout/Layout.svelte';
  import ModalContainer from '$lib/ui/ModalContainer.svelte';
  import ReloadPageButton from '$lib/ui/ReloadPageButton.svelte';
  import { deleteSearchParam, getSearchParam } from '$lib/utils';

  import AccountButtons from './AccountButtons.svelte';
  import AccountCards from './AccountCards.svelte';
  import AccountModal from './AccountModal.svelte';
  import AddOperationButton from './AddOperationButton.svelte';
  import OperationsList from './OperationsList.svelte';

  $: accounts = $accountsStore;

  $: action = getSearchParam($page, 'action');
  $: cardId = getSearchParam($page, 'account-card');

  $: account = accounts.find((x) => x.id.toString() === cardId) ?? null;

  let opened = false;

  $: if (action === 'create') {
    opened = true;
  }
  $: if (!!action && !opened) {
    void deleteSearchParam($page, 'action');
  }

  const handleAccountEdit = (item: AccountViewModel) => {
    account = item;
    opened = true;
  };

  let operationsContainer: HTMLDivElement;
  let header: 'accounts' | 'operations' = 'accounts';

  let title = $translate('accounts.title');
  let leftSlot = ReloadPageButton;
  let rightSlot = AccountButtons;

  function handlePageScroll(e: Event) {
    const scrollTop = (e.target as HTMLElement).scrollTop;
    const operationsContainerPosition = operationsContainer.offsetTop;
    if (scrollTop > operationsContainerPosition && header !== 'operations') {
      title = $translate('transactions.title');
      rightSlot = AddOperationButton;
      header = 'operations';
    } else if (scrollTop < operationsContainerPosition && header !== 'accounts') {
      title = $translate('accounts.title');
      rightSlot = AccountButtons;
      header = 'accounts';
    }
  }
</script>

<Layout {title} {leftSlot} {rightSlot}>
  <div class="container" on:scroll={handlePageScroll}>
    <AccountCards onEdit={handleAccountEdit} />
    <div bind:this={operationsContainer}>
      <OperationsList {account} />
    </div>
  </div>
</Layout>

{#if opened}
  <ModalContainer>
    <AccountModal account={action === 'create' ? null : account} bind:opened />
  </ModalContainer>
{/if}

<style>
  .container {
    height: 100%;
    overflow-y: auto;
  }
</style>
