<script lang="ts">
  import { invalidate } from '$app/navigation';
  import { isApiError } from '$lib/api/ApiError';
  import { deps } from '$lib/deps';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import Input from '$lib/ui/Input.svelte';
  import Modal from '$lib/ui/Modal.svelte';
  import { showErrorToast } from '$lib/ui/toasts';

  export let opened: boolean;
  export let userId: string | number | null;

  let oldPassword = '';
  let newPassword = '';
  let repeatPassword = '';

  const handleSubmit = async (e: SubmitEvent) => {
    if (newPassword !== repeatPassword) {
      showErrorToast($translate('auth.passwords_must_be_same'));
      e.preventDefault();
      return;
    }
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({
        oldPassword,
        newPassword,
      }),
    });
    if (response.ok) {
      await invalidate(deps.user);
      opened = false;
    } else {
      const data = await response.json();
      if (isApiError(data)) {
        switch (data.code) {
          case 'INCORRECT_LOGIN_OR_PASSWORD':
            showErrorToast($translate('auth.incorrect_old_password'));
            return;
        }
      }
      showErrorToast($translate('settings.profile.change_password_failure'));
    }
  };
</script>

<Modal header={$translate('settings.profile.change_password')} bind:opened>
  <form class="flex-col gap-1" on:submit|preventDefault={handleSubmit}>
    <Input
      label={$translate('auth.old_password')}
      bind:value={oldPassword}
      name="oldPassword"
      type="password"
      autocomplete
      required
    />
    <Input
      label={$translate('auth.new_password')}
      bind:value={newPassword}
      name="newPassword"
      type="password"
      minlength={6}
      autocomplete
      required
    />
    <Input
      label={$translate('auth.repeat_password')}
      bind:value={repeatPassword}
      type="password"
      minlength={6}
      autocomplete
      required
    />
    <div class="grid-col-2 gap-1">
      <Button text={$translate('common.cancel')} color="secondary" type="button" on:click={() => (opened = false)} />
      <Button text={$translate('common.accept')} color="primary" type="submit" />
    </div>
  </form>
</Modal>

<style>
  form {
    width: 15rem;
  }
</style>
