<script lang="ts">
  import { invalidate } from '$app/navigation';
  import type { ActionResult } from '@sveltejs/kit';

  import { deps } from '$lib/deps';
  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import FormContainer from '$lib/ui/FormContainer.svelte';
  import { backLink, title } from '$lib/ui/header';
  import Input from '$lib/ui/Input.svelte';
  import { showErrorToast, showSuccessToast } from '$lib/ui/toasts';

  import type { PageData } from './$types';

  export let data: PageData;

  let category = data?.category;

  title.set($translate('categories.edit_category'));
  backLink.set(routes.categories.path);

  const onUpdate = async (result: ActionResult, next: (result: ActionResult) => void) => {
    if (result.type === 'redirect') {
      showSuccessToast($translate('common.save_changes_success'));
      await invalidate(deps.categories);
    } else if (result.type === 'invalid') {
      showErrorToast($translate('common.save_changes_failure'));
    }
    await next(result);
  };

  const onDelete = async (result: ActionResult, next: (result: ActionResult) => void) => {
    if (result.type === 'redirect') {
      showSuccessToast($translate('categories.delete_category_success'));
      await invalidate(deps.categories);
    } else if (result.type === 'invalid') {
      showErrorToast($translate('categories.delete_category_failure'));
    }
    await next(result);
  };
</script>

<FormContainer action={'?/update'} onResult={onUpdate}>
  <Input label={$translate('categories.name')} name="name" value={category?.name} required />
  <Input label={$translate('categories.icon')} name="icon" value={category?.icon} optional />
  <Button text={$translate('common.save')} type="submit" />
  <FormContainer action="?/delete" onResult={onDelete}>
    <Button text={$translate('categories.delete_category')} appearance="transparent" color="danger" type="submit" />
  </FormContainer>
</FormContainer>
