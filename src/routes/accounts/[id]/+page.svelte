<script lang="ts">
  import { invalidate } from '$app/navigation';
  import type { ActionResult } from '@sveltejs/kit';

  import { deps } from '$lib/deps';
  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import FormContainer from '$lib/ui/FormContainer.svelte';
  import { backLink, useTitle } from '$lib/ui/header';
  import Input from '$lib/ui/Input.svelte';
  import { showErrorToast, showSuccessToast } from '$lib/ui/toasts';

  import type { PageData } from './$types';
  import DeleteAccountModal from './DeleteAccountModal.svelte';

  export let data: PageData;

  $: account = data.account;

  useTitle($translate('accounts.edit_account'));
  $: backLink.set(routes.accounts.path + (account ? `?account-card=${account.id}` : ''));

  const onSave = async (result: ActionResult, next: (result: ActionResult) => void) => {
    if (result.type === 'redirect') {
      showSuccessToast($translate('common.save_changes_success'));
      await invalidate(deps.accounts);
    } else if (result.type === 'failure') {
      showErrorToast($translate('common.save_changes_failure'));
    }
    await next(result);
  };

  let deleteAccountModalOpened = false;
</script>

{#if !!account}
  <FormContainer action="?/update" onResult={onSave}>
    <Input value={account.name} label={$translate('accounts.name')} name="name" required />
    <Input value={account.currency} label={$translate('accounts.currency')} name="currency" required />
    <Input value={account.icon} label={$translate('accounts.icon')} name="icon" optional />
    <Input value={`${account.order}`} label={$translate('accounts.order')} name="order" type="number" />
    <!-- <Input value={account.color} label={$translate('accounts.color')} placeholder="#FFFFFF" name="color" optional /> -->
    <Button text={$translate('common.save')} type="submit" />
    <Button
      on:click={() => (deleteAccountModalOpened = true)}
      text={$translate('accounts.delete_account')}
      appearance="transparent"
      color="danger"
    />
  </FormContainer>
  <DeleteAccountModal bind:opened={deleteAccountModalOpened} />
{/if}
