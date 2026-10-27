<script lang="ts">
  import { page } from '#lib/page.js';

  import { accountsStore } from '#lib/data/index.js';
  import type { AccountViewModel } from '#lib/data/interfaces.js';
  import { translate } from '#lib/translate/index.js';
  import Layout from '#lib/ui/layout/Layout.svelte';
  import { isWideScreen } from '#lib/ui/layout/media.js';
  import ModalContainer from '#lib/ui/ModalContainer.svelte';
  import ReloadPageButton from '#lib/ui/ReloadPageButton.svelte';
  import { deleteSearchParam, getSearchParam } from '#lib/utils/index.js';

  import AccountButtons from './AccountButtons.svelte';
  import AccountCards from './AccountCards.svelte';
  import AccountModal from './AccountModal.svelte';
  import AddOperationButton from './AddOperationButton.svelte';
  import OperationsList from './OperationsList.svelte';
  import OperationsSplitView from '../transactions/OperationsSplitView.svelte';

  $: accounts = $accountsStore;

  $: action = getSearchParam($page, 'action');
  $: cardId = getSearchParam($page, 'account-card');

  $: account = accounts.find((x) => x.id.toString() === cardId) ?? null;

  $: operationId = getSearchParam($page, 'operation-id');
  const closeOperation = () => void deleteSearchParam($page, ['operation-id', 'accountId']);

  let opened = false;
  let previousAction: string | null = null;

  $: if (action !== previousAction) {
    if (action === 'create' || previousAction === 'create') opened = action === 'create';
    // Read again when the URL changes, including browser back/forward.
    // eslint-disable-next-line no-useless-assignment
    previousAction = action;
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

<Layout {title} {leftSlot} {rightSlot} wide>
  <OperationsSplitView {operationId} onClose={closeOperation}>
    <div class="container" on:scroll={handlePageScroll}>
      <AccountCards onEdit={handleAccountEdit} />
      <div bind:this={operationsContainer}><OperationsList {account} inlineDetails={$isWideScreen} /></div>
    </div>
  </OperationsSplitView>
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
