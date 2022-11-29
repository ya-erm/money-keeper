<script lang="ts">
  import { invalidate } from '$app/navigation';
  import type { ActionResult } from '@sveltejs/kit';

  import { deps } from '$lib/deps';
  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import FormContainer from '$lib/ui/FormContainer.svelte';
  import { backLink } from '$lib/ui/header';
  import Input from '$lib/ui/Input.svelte';
  import { showErrorToast, showSuccessToast } from '$lib/ui/toasts';

  backLink.set(routes.accounts.path);

  const onCreate = async (result: ActionResult, next: (result: ActionResult) => void) => {
    if (result.type === 'redirect') {
      showSuccessToast($translate('accounts.create_account_success'));
      await invalidate(deps.accounts);
    } else if (result.type === 'invalid') {
      showErrorToast($translate('accounts.create_account_failure'));
    }
    await next(result);
  };
</script>

<FormContainer action="?/create" onResult={onCreate}>
  <Input label={$translate('accounts.name')} name="name" required />
  <Input label={$translate('accounts.currency')} name="currency" required />
  <Input label={$translate('accounts.icon')} name="icon" optional />
  <!-- <Input label={$translate('accounts.color')} placeholder="#FFFFFF" name="color" optional /> -->
  <Button text={$translate('common.create')} type="submit" />
</FormContainer>
