<script lang="ts">
  import { invalidate } from '$app/navigation';
  import type { ActionResult } from '@sveltejs/kit';

  import { deps } from '$lib/deps';
  import type { CategoryType } from '$lib/interfaces';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import FormContainer from '$lib/ui/FormContainer.svelte';
  import Input from '$lib/ui/Input.svelte';
  import { showErrorToast, showSuccessToast } from '$lib/ui/toasts';

  export let type: CategoryType;
  export let onCreate: (() => void) | null = null;

  const handleCreate = async (result: ActionResult, next: (result: ActionResult) => void) => {
    if (result.type === 'success' || result.type === 'redirect') {
      showSuccessToast($translate('categories.create_category_success'));
      await invalidate(deps.categories);
      onCreate?.();
    } else if (result.type === 'invalid') {
      showErrorToast($translate('categories.create_category_failure'));
    }
    if (!onCreate) {
      await next(result);
    }
  };
</script>

<FormContainer action={'/categories/create?/create'} onResult={handleCreate}>
  <input name="type" value={type} class="hidden" required />
  <Input label={$translate('categories.name')} name="name" required />
  <Input label={$translate('categories.icon')} name="icon" optional />
  <Button text={$translate('common.create')} type="submit" />
</FormContainer>
