<script lang="ts">
  import { invalidate } from '$app/navigation';
  import { deps } from '$lib/deps';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import Input from '$lib/ui/Input.svelte';
  import Modal from '$lib/ui/Modal.svelte';
  import { showErrorToast } from '$lib/ui/toasts';

  export let opened: boolean;
  export let userId: string | number | null;
  export let value: string | null | undefined;

  let _value = value ?? '';

  const handleSubmit = async () => {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: _value,
      }),
    });
    if (response.ok) {
      await invalidate(deps.user);
      opened = false;
    } else {
      showErrorToast($translate('settings.profile.change_name_failure'));
    }
  };
</script>

<Modal header={$translate('settings.profile.change_name')} bind:opened>
  <form class="flex-col gap-1" on:submit|preventDefault={handleSubmit}>
    <Input label={$translate('auth.name')} name="name" testId="ChangeNameInput" bind:value={_value} required />
    <div class="grid-col-2 gap-1">
      <Button text={$translate('common.cancel')} color="secondary" on:click={() => (opened = false)} />
      <Button text={$translate('common.accept')} color="primary" type="submit" />
    </div>
  </form>
</Modal>

<style>
  form {
    width: 15rem;
  }
</style>
