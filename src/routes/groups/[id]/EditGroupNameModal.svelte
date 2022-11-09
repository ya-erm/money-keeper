<script lang="ts">
  import type { ActionResult } from '@sveltejs/kit';
  import type { Writable } from 'svelte/store';

  import Button from '$lib/ui/Button.svelte';
  import FormContainer from '$lib/ui/FormContainer.svelte';
  import Input from '$lib/ui/Input.svelte';
  import Modal from '$lib/ui/Modal.svelte';

  import type { GroupWithUsers } from '$lib/interfaces';
  import { translate } from '$lib/translate';
  import { showErrorToast } from '$lib/ui/toasts';

  export let opened: boolean;

  export let group: Writable<GroupWithUsers>;

  let value = $group.name;

  const handleResult = async (result: ActionResult<{ group: GroupWithUsers }>) => {
    if (result.type === 'success' && result.data?.group) {
      group.set(result.data.group);
      opened = false;
    } else {
      showErrorToast($translate('common.save_changes_failure'));
    }
  };
</script>

<Modal header={$translate('groups.edit_group_name')} bind:opened>
  <FormContainer action="?/updateGroup" onResult={handleResult}>
    <Input label={$translate('groups.name')} bind:value name="name" required />
    <Button text={$translate('common.save')} type="submit" />
  </FormContainer>
</Modal>
