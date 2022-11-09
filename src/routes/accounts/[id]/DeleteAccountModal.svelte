<script lang="ts">
  import type { ActionResult } from '@sveltejs/kit';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import FormContainer from '$lib/ui/FormContainer.svelte';
  import Modal from '$lib/ui/Modal.svelte';
  import { showErrorToast, showSuccessToast } from '$lib/ui/toasts';

  export let opened: boolean;

  const onDelete = (result: ActionResult, next: (result: ActionResult) => void) => {
    if (result.type === 'redirect') {
      showSuccessToast($translate('accounts.delete_account_success'));
    } else if (result.type === 'invalid') {
      showErrorToast($translate('accounts.delete_account_failure'));
    }
    next(result);
  };
</script>

<Modal header={$translate('accounts.delete_account_confirm')} bind:opened>
  <FormContainer width={20} action="?/delete" onResult={onDelete}>
    <span>{$translate('accounts.delete_account_confirm_description')}</span>
    <div class="actions gap-1">
      <Button text={$translate('accounts.delete_account')} color="danger" type="submit" />
      <Button text={$translate('common.cancel')} on:click={() => (opened = false)} color="white" bordered />
    </div>
  </FormContainer>
</Modal>

<style>
  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
</style>
