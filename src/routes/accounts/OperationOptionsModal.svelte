<script lang="ts">
  import type { TransactionViewModel } from '$lib/data/interfaces';
  import { copyOperation, deleteOperation } from '$lib/data/operations';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import Icon from '$lib/ui/Icon.svelte';
  import Modal from '$lib/ui/Modal.svelte';
  import { showSuccessToast } from '$lib/ui/toasts';

  export let opened: boolean;
  export let operation: TransactionViewModel;

  const onClose = () => (opened = false);

  const handleDuplicate = () => {
    copyOperation(operation, { save: true });
    onClose();
  };

  const handleDelete = () => {
    deleteOperation(operation.id);
    showSuccessToast($translate('transactions.delete_transaction_success'), {
      testId: 'DeleteTransactionSuccessToast',
    });
    onClose();
  };
</script>

<Modal bind:opened header={$translate('common.additional_options')}>
  <div class="flex-col gap-1 select-none">
    <Button appearance="transparent" bordered on:click={handleDuplicate}>
      <Icon name="mdi:content-copy" />
      <span>{$translate('common.duplicate')}</span>
    </Button>
    <Button color="danger" appearance="transparent" bordered on:click={handleDelete}>
      <Icon name="mdi:delete-outline" />
      <span>{$translate('common.delete')}</span>
    </Button>
    <Button color="white" bordered on:click={onClose}>
      <span>{$translate('common.cancel')}</span>
    </Button>
  </div>
</Modal>
