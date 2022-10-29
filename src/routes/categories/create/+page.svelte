<script lang="ts">
  import type { ActionResult } from '@sveltejs/kit';

  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import FormContainer from '$lib/ui/FormContainer.svelte';
  import { backLink } from '$lib/ui/header';
  import Input from '$lib/ui/Input.svelte';
  import { showErrorToast, showSuccessToast } from '$lib/ui/toasts';

  backLink.set(routes.categories.path);

  const onCreate = (result: ActionResult, next: (result: ActionResult) => void) => {
    if (result.type === 'success') {
      showSuccessToast($translate('categories.create_category_success'));
    } else if (result.type === 'invalid') {
      showErrorToast($translate('categories.create_category_failure'));
    }
    next(result);
  };
</script>

<FormContainer action={'?/create'} onResult={onCreate}>
  <Input label={$translate('categories.name')} name="name" required />
  <Input label={$translate('categories.icon')} name="icon" optional />
  <Button text={$translate('common.create')} type="submit" />
</FormContainer>
