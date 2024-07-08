<script lang="ts">
  import { page } from '$app/stores';

  import { accountsStore } from '$lib/data';
  import type { AccountViewModel } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import ModalContainer from '$lib/ui/ModalContainer.svelte';
  import ReloadPageButton from '$lib/ui/ReloadPageButton.svelte';
  import { backLink, rightButton, title } from '$lib/ui/header';
  import { useLeftButton, useRightButton, useTitle } from '$lib/ui/header/model';
  import { deleteSearchParam, getSearchParam } from '$lib/utils';

  import AccountButtons from './AccountButtons.svelte';
  import AccountCards from './AccountCards.svelte';
  import AccountModal from './AccountModal.svelte';
  import AddOperationButton from './AddOperationButton.svelte';
  import OperationsList from './OperationsList.svelte';

  backLink.set(null);
  useLeftButton(ReloadPageButton);
  useTitle($translate('accounts.title'));
  useRightButton(AccountButtons);

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

  function handlePageScroll(e: Event) {
    const scrollTop = (e.target as HTMLElement).scrollTop;
    const operationsContainerPosition = operationsContainer.offsetTop;
    if (scrollTop > operationsContainerPosition && header !== 'operations') {
      title.set($translate('transactions.title'));
      rightButton.set(AddOperationButton);
      header = 'operations';
    } else if (scrollTop < operationsContainerPosition && header !== 'accounts') {
      title.set($translate('accounts.title'));
      rightButton.set(AccountButtons);
      header = 'accounts';
    }
  }
</script>

<div class="container" on:scroll={handlePageScroll}>
  <AccountCards onEdit={handleAccountEdit} />
  <div bind:this={operationsContainer}>
    <OperationsList {account} />
  </div>
</div>

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
