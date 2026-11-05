<script lang="ts">
  import { tick } from 'svelte';
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

  let compactActions = false;

  function fitActionLabels(header: HTMLElement, enabled: boolean) {
    let observer: ResizeObserver | undefined;
    let generation = 0;

    async function update(enabled: boolean) {
      const current = ++generation;
      observer?.disconnect();
      compactActions = false;
      if (!enabled) return;
      await tick();
      if (current !== generation) return;

      const heading = header.querySelector<HTMLElement>('.operations-heading')!;
      const actions = header.querySelector<HTMLElement>('.operation-actions')!;
      const scan = header.querySelector<HTMLElement>('.scan-receipt-button')!;
      const icon = header.querySelector<HTMLElement>('.scan-receipt-icon')!;
      const labels = [...header.querySelectorAll<HTMLElement>('.action-label')];
      const width = (element: HTMLElement) => element.getBoundingClientRect().width;
      const gap = (element: HTMLElement) => parseFloat(getComputedStyle(element).columnGap) || 0;
      const measure = () => {
        // Hidden labels keep their intrinsic widths, so expanding again never oscillates.
        const fullWidth = width(heading) + width(icon) + labels.reduce((sum, label) => sum + width(label), 0);
        compactActions = fullWidth + gap(header) + gap(actions) + gap(scan) > header.clientWidth;
      };
      observer = new ResizeObserver(measure);
      for (const element of [header, heading, icon, ...labels]) observer.observe(element);
      measure();
    }

    void update(enabled);
    return {
      update: (enabled: boolean) => void update(enabled),
      destroy: () => {
        generation++;
        observer?.disconnect();
      },
    };
  }

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
    <div
      class="flex gap-1"
      class:with-receipt-scan={!!account?.showReceiptScanButton}
      class:compact-actions={compactActions}
      use:fitActionLabels={!!account?.showReceiptScanButton}
      data-testId="OperationsHeader"
    >
      <h3 class="m-0 flex-grow font-normal">
        <span class="operations-heading">
          <span>{$translate('transactions.title')}</span>
          <span class="operations-count">
            {$translate('common.count', { values: { count: allFilteredOperations.length } })}
          </span>
        </span>
      </h3>
      <div class="operation-actions gap-1">
        {#if account?.showReceiptScanButton}
          <a
            href={scanReceiptHref}
            class="scan-receipt-button"
            aria-label={$translate('receipts.qr_code')}
            title={$translate('receipts.qr_code')}
            data-testId="AccountScanReceiptButton"
          >
            <span class="scan-receipt-icon" aria-hidden="true"><Icon name="mdi:camera" size={1.1} /></span>
            <span class="action-label">{$translate('receipts.qr_code')}</span>
          </a>
        {/if}
        <a
          href={addOperationHref}
          aria-label={$translate('common.add')}
          title={$translate('common.add')}
          data-testId="AddOperationButton"
        >
          {#if account?.showReceiptScanButton}
            <span class="add-operation-icon" aria-hidden="true"><Icon name="mdi:plus" size={1.1} /></span>
          {/if}
          <span class="action-label">{$translate('common.add')}</span>
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
    position: relative;
  }
  .with-receipt-scan .operations-heading {
    display: inline-block;
    white-space: nowrap;
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
  .with-receipt-scan .operation-actions a {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }
  .scan-receipt-icon {
    display: inline-flex;
  }
  .add-operation-icon {
    display: none;
  }
  .compact-actions .add-operation-icon {
    display: inline-flex;
  }
  .compact-actions .operation-actions a {
    min-width: 2rem;
    min-height: 2rem;
    justify-content: center;
  }
  .with-receipt-scan .action-label {
    display: inline-block;
    width: max-content;
  }
  .compact-actions .action-label {
    position: absolute;
    top: 0;
    left: 0;
    visibility: hidden;
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
