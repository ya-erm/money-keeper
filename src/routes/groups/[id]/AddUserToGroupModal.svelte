<script lang="ts">
  import type { ActionResult } from '@sveltejs/kit';
  import type { Writable } from 'svelte/store';

  import type { GroupWithUsers } from '$lib/interfaces';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import FormContainer from '$lib/ui/FormContainer.svelte';
  import Input from '$lib/ui/Input.svelte';
  import Modal from '$lib/ui/Modal.svelte';
  import { showErrorToast } from '$lib/ui/toasts';

  export let opened: boolean;

  export let group: Writable<GroupWithUsers>;

  const handleResult = async (result: ActionResult<{ group: GroupWithUsers }>) => {
    if (result.type === 'success' && result.data?.group) {
      group.set(result.data.group);
      opened = false;
    } else {
      showErrorToast($translate('groups.failed_to_add_user'));
    }
  };
</script>

<Modal header={$translate('groups.add_user')} bind:opened>
  <FormContainer action="?/addUser" onResult={handleResult}>
    <Input label={$translate('groups.username')} name="login" required />
    <Button text={$translate('common.add')} type="submit" />
  </FormContainer>
</Modal>
