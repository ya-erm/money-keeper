<script lang="ts">
  import { tick } from 'svelte';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import { translate } from '#lib/translate/index.js';

  export let count: number;
  export let addHref: string | null;
  export let scanHref: string | null = null;
  export let addTestId = 'AddOperationButton';
  export let scanTestId = 'AccountScanReceiptButton';

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
</script>

<div
  class="flex gap-1"
  class:with-receipt-scan={!!scanHref}
  class:compact-actions={compactActions}
  use:fitActionLabels={!!scanHref}
  data-testId="OperationsHeader"
>
  <h3 class="m-0 flex-grow font-normal">
    <span class="operations-heading">
      <span>{$translate('transactions.title')}</span>
      <span class="operations-count">
        {$translate('common.count', { values: { count: count } })}
      </span>
    </span>
  </h3>
  {#if addHref}<div class="operation-actions gap-1">
      {#if scanHref}
        <a
          href={scanHref}
          class="scan-receipt-button"
          aria-label={$translate('receipts.qr_code')}
          title={$translate('receipts.qr_code')}
          data-testId={scanTestId}
        >
          <span class="scan-receipt-icon" aria-hidden="true"><Icon name="mdi:camera" size={1.1} /></span>
          <span class="action-label">{$translate('receipts.qr_code')}</span>
        </a>
      {/if}
      <a href={addHref} aria-label={$translate('common.add')} title={$translate('common.add')} data-testId={addTestId}>
        {#if scanHref}
          <span class="add-operation-icon" aria-hidden="true"><Icon name="mdi:plus" size={1.1} /></span>
        {/if}
        <span class="action-label">{$translate('common.add')}</span>
      </a>
    </div>{/if}
</div>

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
  .operations-count {
    font-size: 0.85rem;
    color: var(--secondary-text-color);
  }
</style>
