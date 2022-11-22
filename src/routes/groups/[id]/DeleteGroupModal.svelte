<script lang="ts">
  import type { ActionResult } from '@sveltejs/kit';

  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import FormContainer from '$lib/ui/FormContainer.svelte';
  import Modal from '$lib/ui/Modal.svelte';
  import { showErrorToast } from '$lib/ui/toasts';

  export let opened: boolean;
  export let groupId: number;

  const handleResult = async (result: ActionResult, next: (result: ActionResult) => void) => {
    if (result.type === 'redirect') {
      opened = false;
    } else {
      showErrorToast($translate('groups.failed_to_delete_group'));
    }
    next(result);
  };
</script>

<Modal header={$translate('groups.delete_group_confirm')} bind:opened>
  <FormContainer width={20} action="?/deleteGroup" onResult={handleResult}>
    <span>{$translate('groups.delete_group_confirm_description')}</span>
    <input value={groupId} name="groupId" class="hidden" type="number" required readonly />
    <div class="actions gap-1">
      <Button text={$translate('groups.delete_group')} color="danger" type="submit" />
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
