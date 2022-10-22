<script lang="ts">
  import type { Writable } from 'svelte/store';
  import type { ActionResult } from '@sveltejs/kit';

  import Button from '$lib/ui/Button.svelte';
  import FormContainer from '$lib/ui/FormContainer.svelte';
  import Input from '$lib/ui/Input.svelte';
  import Modal from '$lib/ui/Modal.svelte';

  import type { GroupWithUsers } from './interface';
  import { showErrorToast } from '$lib/ui/toasts';
  import { translate } from '$lib/translate';

  export let opened: boolean;
  export let close: () => void;

  export let group: Writable<GroupWithUsers>;

  let value = $group.name;

  const handleResult = async (result: ActionResult<{ group: GroupWithUsers }>) => {
    if (result.type === 'success' && result.data?.group) {
      group.set(result.data.group);
      close();
    } else {
      showErrorToast($translate('common.failed_to_save_changes'));
    }
  };
</script>

<Modal header={$translate('groups.edit_group_name')} bind:opened on:close={close}>
  <FormContainer action="?/updateGroup" onResult={handleResult}>
    <Input label={$translate('groups.name')} bind:value name="name" required />
    <Button text={$translate('common.save')} type="submit" />
  </FormContainer>
</Modal>
