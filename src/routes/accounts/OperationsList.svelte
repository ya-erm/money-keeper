<script lang="ts">
  import Icon from '@ya-erm/svelte-ui/Icon';
  import Input from '@ya-erm/svelte-ui/Input';
  import ShowMoreContainer from '@ya-erm/svelte-ui/ShowMoreContainer';
  import Spoiler from '@ya-erm/svelte-ui/Spoiler';
  import SpoilerToggle from '@ya-erm/svelte-ui/SpoilerToggle';

  import { page } from '#lib/page.js';

  import { operationsStore } from '#lib/data/index.js';
  import type { Account } from '#lib/data/interfaces.js';
  import { route } from '#lib/routes.js';
  import { translate } from '#lib/translate/index.js';
  import { futureOperationsPredicate, pastOperationsPredicate, withSearchParams } from '#lib/utils/index.js';

  import GroupedOperationsList from './GroupedOperationsList.svelte';

  export let account: Account | null = null;
  /** Details are shown next to the list by the parent */
  export let inlineDetails: boolean = false;

  $: operations = $operationsStore;

  $: addOperationHref = inlineDetails
    ? withSearchParams($page, { 'operation-id': 'new', accountId: account?.id ?? null })
    : route('transactions.create') + (account?.id ? `?accountId=${account?.id}` : '');

  $: scanReceiptHref = `${route('transactions.create')}?${new URLSearchParams({
    accountId: account?.id ?? '',
    'scan-receipt': '1',
  })}`;

  let search: string = '';
  let limit = 20;

  $: accountOperations = account ? operations.filter((t) => t.accountId === account?.id) : null;
  $: allFilteredOperations =
    (accountOperations ?? operations).filter(
      (t) =>
        !search ||
        t.comment?.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.category?.name.toLowerCase().includes(search.toLowerCase()) ||
        t.date.substring(0, 10).includes(search) ||
        t.tags.some((tag) => tag.name.toLowerCase().includes(search.toLowerCase())) ||
        `${t.amount} ${account?.currency}`.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];
  $: filteredOperations = allFilteredOperations.slice(0, limit);

  let featureOperationsHidden = true;

  $: pastOperations = filteredOperations.filter(pastOperationsPredicate());
  $: futureOperations = filteredOperations.filter(futureOperationsPredicate());
</script>

<ShowMoreContainer bind:limit step={20} total={allFilteredOperations.length} translate={$translate}>
  <div class="operations-container p-1">
    <div class="flex gap-1" class:with-receipt-scan={!!account?.showReceiptScanButton}>
      <h3 class="m-0 flex-grow font-normal">
        <span>{$translate('transactions.title')}</span>
        <span class="operations-count">
          {$translate('common.count', { values: { count: allFilteredOperations.length } })}
        </span>
      </h3>
      <div class="operation-actions gap-1">
        {#if account?.showReceiptScanButton}
          <a href={scanReceiptHref} class="scan-receipt-button" data-testId="AccountScanReceiptButton">
            <Icon name="mdi:camera" size={1.1} />
            <span>{$translate('receipts.qr_code')}</span>
          </a>
        {/if}
        <a href={addOperationHref} data-testId="AddOperationButton">
          {$translate('common.add')}
        </a>
      </div>
    </div>
    <div class="operations-search-container flex gap-0.5">
      <div class="flex-grow">
        <Input bind:value={search} icon="mdi:search" placeholder={$translate('common.search')} clearable />
      </div>
      <!-- 
    <Button appearance="transparent" bordered>
      <Icon size={1.25} name="mdi:filter" />
    </Button> 
    -->
    </div>
    {#if futureOperations.length > 0}
      <Spoiler hidden={featureOperationsHidden}>
        <SpoilerToggle slot="spoiler-header" bind:hidden={featureOperationsHidden} translate={$translate}>
          <span>{$translate('transactions.future_operations')}</span>
          <span class="operations-count">
            {$translate('common.count', { values: { count: futureOperations.length } })}
          </span>
        </SpoilerToggle>

        <GroupedOperationsList {account} operations={futureOperations} showDescription={!!search} {inlineDetails} />
      </Spoiler>
      <hr class="line" />
    {/if}

    <GroupedOperationsList {account} operations={pastOperations} showDescription={!!search} {inlineDetails} />
  </div>
</ShowMoreContainer>

<style>
  .with-receipt-scan {
    align-items: center;
    flex-wrap: wrap;
  }
  .operation-actions {
    display: contents;
  }
  .with-receipt-scan .operation-actions {
    display: flex;
    align-items: center;
    margin-left: auto;
    white-space: nowrap;
  }
  .scan-receipt-button {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }
  .operations-search-container {
    padding: 1rem 0;
    background: var(--background-color);
    position: relative;
  }
  .operations-count {
    font-size: 0.85rem;
    color: var(--secondary-text-color);
  }
  .line {
    margin: 0;
    top: 0.5rem;
    position: relative;
    border: 0;
    border-top: 1px solid var(--border-color);
    height: 1px;
  }
</style>
