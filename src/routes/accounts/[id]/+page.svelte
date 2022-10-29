<script lang="ts">
  import type { ActionResult } from '@sveltejs/kit';

  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import FormContainer from '$lib/ui/FormContainer.svelte';
  import { backLink, title } from '$lib/ui/header';
  import Input from '$lib/ui/Input.svelte';
  import { showErrorToast, showSuccessToast } from '$lib/ui/toasts';

  import type { PageData } from './$types';

  export let data: PageData;

  $: account = data.account;

  title.set($translate('accounts.edit_account'));
  $: backLink.set(routes.accounts.path + (account ? `#account-card-${account.id}` : ''));

  const onSave = (result: ActionResult, next: (result: ActionResult) => void) => {
    if (result.type === 'redirect') {
      showSuccessToast($translate('common.save_changes_success'));
    } else if (result.type === 'invalid') {
      showErrorToast($translate('common.save_changes_failure'));
    }
    next(result);
  };

  const onDelete = (result: ActionResult, next: (result: ActionResult) => void) => {
    if (result.type === 'redirect') {
      showSuccessToast($translate('accounts.delete_account_success'));
    } else if (result.type === 'invalid') {
      showErrorToast($translate('accounts.delete_account_failure'));
    }
    next(result);
  };
</script>

{#if !!account}
  <FormContainer action="?/update" onResult={onSave}>
    <Input value={account.name} label={$translate('accounts.name')} name="name" required />
    <Input value={account.currency} label={$translate('accounts.currency')} name="currency" required />
    <Input value={account.icon} label={$translate('accounts.icon')} name="icon" optional />
    <Input value={account.color} label={$translate('accounts.color')} placeholder="#FFFFFF" name="color" optional />
    <Button text={$translate('common.save')} type="submit" />
    <FormContainer action="?/delete" onResult={onDelete}>
      <Button text={$translate('accounts.delete_account')} appearance="transparent" color="danger" type="submit" />
    </FormContainer>
  </FormContainer>
{/if}
