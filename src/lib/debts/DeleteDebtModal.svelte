<script lang="ts">
  import Button from '@ya-erm/svelte-ui/Button';
  import Modal from '#lib/ui/Modal.svelte';
  import { translate } from '#lib/translate/index.js';
  import { handleError } from '#lib/utils/handleError.js';

  export let opened = false;
  export let linkedOperation = false;
  export let onDelete: () => void | Promise<void> = () => {};
  let deleting = false;
  async function confirmDelete() {
    if (deleting) return;
    deleting = true;
    try {
      await onDelete();
      opened = false;
    } catch (error) {
      handleError(error);
    } finally {
      deleting = false;
    }
  }
</script>

<Modal bind:opened header={$translate('common.delete')} width={22} manageHistory>
  <div data-testId="DebtDeleteConfirm">
    <p class="message">{$translate(linkedOperation ? 'debts.delete_payment' : 'debts.delete_confirm')}</p>
    <div class="grid-col-2 gap-1">
      <Button
        color="white"
        bordered
        disabled={deleting}
        onClick={() => (opened = false)}
        text={$translate('common.cancel')}
        testId="CancelDebtDeletion"
      />
      <Button
        color="danger"
        disabled={deleting}
        onClick={confirmDelete}
        text={$translate('common.delete')}
        testId="ConfirmDebtDeletion"
      />
    </div>
  </div>
</Modal>

<style>
  .message {
    margin: 0 0 1rem;
  }
</style>
