<script lang="ts">
  import { goto, invalidate } from '$app/navigation';
  import type { ActionResult } from '@sveltejs/kit';
  import { deps } from '$lib/deps';

  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import FormContainer from '$lib/ui/FormContainer.svelte';
  import { backLink, title, useTitle } from '$lib/ui/header';
  import { showErrorToast, showSuccessToast } from '$lib/ui/toasts';

  import ImportRuleForm from '../ImportRuleForm.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  useTitle($translate('transactions.import.rules.edit_rule'));
  backLink.set(routes['transactions.import.rules'].path);

  const handleDeleteResult = async (result: ActionResult) => {
    if (result.type === 'success') {
      showSuccessToast($translate('transactions.import.rules.delete_success'));
      await goto(routes['transactions.import.rules'].path);
    } else {
      showErrorToast($translate('transactions.import.rules.delete_failure'));
    }
  };
</script>

<div>
  <ImportRuleForm action="?/update" rule={data.rule} categories={data.categories} tags={data.tags} />
  <FormContainer action="?/delete" onResult={handleDeleteResult}>
    <Button
      text={$translate('transactions.import.rules.delete')}
      testId="DeleteImportRuleButton"
      appearance="transparent"
      color="danger"
      type="submit"
    />
  </FormContainer>
</div>
