<script lang="ts">
  import Button from '@ya-erm/svelte-ui/Button';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import { showSuccessToast } from '@ya-erm/svelte-ui/toasts';

  import type { TransactionViewModel } from '$lib/data/interfaces';
  import { copyOperation, deleteOperation } from '$lib/data/operations';
  import { translate } from '$lib/translate';
  import Modal from '$lib/ui/Modal.svelte';

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
    <Button appearance="transparent" bordered onClick={handleDuplicate}>
      <Icon name="mdi:content-copy" />
      <span>{$translate('common.duplicate')}</span>
    </Button>
    <Button color="danger" appearance="transparent" bordered onClick={handleDelete}>
      <Icon name="mdi:delete-outline" />
      <span>{$translate('common.delete')}</span>
    </Button>
    <Button color="white" bordered onClick={onClose}>
      <span>{$translate('common.cancel')}</span>
    </Button>
  </div>
</Modal>
