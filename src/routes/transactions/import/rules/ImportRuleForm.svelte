<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto, invalidate } from '$app/navigation';
  import type { Category, ImportRule, Tag } from '@prisma/client';
  import type { ActionResult } from '@sveltejs/kit';

  import { isApiErrorData } from '$lib/api';
  import { deps } from '$lib/deps';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import Input from '$lib/ui/Input.svelte';
  import InputLabel from '$lib/ui/InputLabel.svelte';
  import { showErrorToast, showSuccessToast } from '$lib/ui/toasts';
  import { routes } from '$lib/routes';

  import CategorySelect from '../../CategorySelect.svelte';
  import TagsList from '../../TagsList.svelte';

  export let action: string;

  export let categories: Category[];
  export let tags: Tag[];

  export let rule: (ImportRule & { tags: Tag[] }) | null = null;
  let categoryId = rule?.categoryId;
  let selectedTags = rule?.tags?.map((t) => `${t.id}`);

  let showInfo = false;

  const handleResult = async ({ form, result }: { form: HTMLFormElement; result: ActionResult }) => {
    if (result.type === 'success') {
      await invalidate(deps.importRules);
      showSuccessToast($translate('transactions.import.rules.save_rule_success'));
      await goto(routes['transactions.import.rules'].path);
    }
    if (result.type === 'failure') {
      const formData = new FormData(form);
      if (!formData.get('categoryId') && !formData.get('tags')?.length) {
        showErrorToast($translate('transactions.import.rules.category_or_tags_required'));
        return;
      }
      if (isApiErrorData(result.data)) {
        showErrorToast(result.data.error.message);
      } else {
        showErrorToast($translate('transactions.import.rules.save_rule_failure'));
      }
    }
  };
</script>

<form class="p-1 flex-col gap-1" method="POST" {action} use:enhance={() => handleResult}>
  <div class="flex-col items-start gap-0.25">
    <Button
      appearance="link"
      underlined={false}
      text={$translate('transactions.import.rules.how_does_it_work')}
      on:click={() => (showInfo = !showInfo)}
    />
    {#if showInfo}
      <div class="description">
        {$translate('transactions.import.rules.how_does_it_work.description')}
      </div>
    {/if}
  </div>
  <Input name="text" value={rule?.text} label={$translate('transactions.import.rules.condition')} required />
  <InputLabel text={$translate('transactions.import.rules.category')} optional />
  <CategorySelect bind:categoryId {categories} withoutHeader />
  <InputLabel text={$translate('transactions.import.rules.tags')} optional />
  <TagsList bind:tags bind:selectedTags />
  <Button type="submit" text={$translate('common.save')} />
</form>

<style>
  .description {
    font-size: 0.9em;
  }
</style>
