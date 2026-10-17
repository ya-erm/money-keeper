<script lang="ts">
  import Icon from '@ya-erm/svelte-ui/Icon';

  import { translate } from '$lib/translate';
  import HeaderButton from '$lib/ui/layout/HeaderButton.svelte';

  import CreateTransaction from './create/CreateTransaction.svelte';
  import EditTransaction from './edit/EditTransaction.svelte';

  /**
   * Operation editor for the desktop details column.
   * Narrow screens open the same form as a nested screen from the list.
   */

  /** Selected operation id, `new` for the creation form, `null` when nothing is selected */
  export let operationId: string | null;
  export let onClose: () => void;

  $: creating = operationId === 'new';
</script>

<div class="details" data-testId="OperationDetails">
  {#if operationId !== null}
    <div class="details-header">
      <span class="details-title">
        {creating ? $translate('transactions.new_transaction') : $translate('transactions.edit_transaction')}
      </span>
      <HeaderButton icon="mdi:close" label={$translate('common.close')} onClick={onClose} />
    </div>
    <div class="details-body">
      {#key operationId}
        {#if creating}
          <CreateTransaction onDone={onClose} />
        {:else}
          <EditTransaction id={operationId} onBack={onClose} />
        {/if}
      {/key}
    </div>
  {:else}
    <div class="placeholder">
      <Icon name="mdi:receipt-text-outline" size={3} />
      <span>{$translate('transactions.select_operation')}</span>
    </div>
  {/if}
</div>

<style>
  .details {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
    overflow: hidden;
  }
  .details-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    height: 60px;
    padding: 0 0.5rem 0 1rem;
    flex-shrink: 0;
    background: var(--header-background-color);
    border-bottom: 1px solid var(--border-color);
  }
  .details-title {
    font-size: 1.1rem;
  }
  .details-body {
    flex-grow: 1;
    overflow-y: auto;
  }
  .placeholder {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 1rem;
    text-align: center;
    color: var(--secondary-text-color);
  }
</style>
