<script lang="ts">
  import type { ActionResult } from '@sveltejs/kit';
  import type { Writable } from 'svelte/store';

  import type { GroupWithUsers } from '$lib/interfaces';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import FormContainer from '$lib/ui/FormContainer.svelte';
  import Modal from '$lib/ui/Modal.svelte';
  import { showErrorToast } from '$lib/ui/toasts';

  export let opened: boolean;

  export let group: Writable<GroupWithUsers>;
  export let userId: number;

  const handleResult = async (result: ActionResult<{ group: GroupWithUsers }>) => {
    if (result.type === 'success' && result.data?.group) {
      group.set(result.data.group);
      opened = false;
    } else {
      showErrorToast($translate('groups.failed_to_delete_user'));
    }
  };
</script>

<Modal width={22} header={$translate('groups.delete_user_confirm')} bind:opened>
  <FormContainer width="100%" action="?/deleteUser" onResult={handleResult}>
    <span>{$translate('groups.delete_user_confirm_description')}</span>
    <input value={userId} name="userId" class="hidden" type="number" required readonly />
    <div class="actions gap-1">
      <Button text={$translate('groups.delete_user')} color="danger" type="submit" />
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
