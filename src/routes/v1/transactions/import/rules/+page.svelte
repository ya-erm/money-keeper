<script lang="ts">
  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import { backLink, useRightButton } from '$lib/ui/header/model';
  import Input from '$lib/ui/Input.svelte';
  import NoItems from '$lib/ui/NoItems.svelte';

  import AddRuleButton from './AddRuleButton.svelte';
  import ImportRuleListItem from './ImportRuleListItem.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
  $: rules = data.rules;

  let search = '';
  $: filteredRules = data.rules.filter(
    (rule) =>
      rule.text.toLowerCase().includes(search.toLowerCase()) ||
      rule.category?.name.toLowerCase().includes(search.toLowerCase()) ||
      rule.tags.some((tag) => tag.name.toLowerCase().includes(search.toLowerCase())),
  );

  useRightButton(AddRuleButton);
  backLink.set(routes['transactions.import'].path);
</script>

<div class="p-1 flex-col">
  {#if !rules.length}
    <div class="flex-col gap-0.5 items-center">
      <NoItems />
      <a href={routes['transactions.import.rules.create'].path}>
        <Button text={$translate('transactions.import.rules.create')} />
      </a>
    </div>
  {:else}
    <div class="mb-0.5">
      <Input bind:value={search} placeholder={$translate('common.search')} clearable />
    </div>
    {#if !filteredRules.length}
      <NoItems type="NothingFound" />
    {/if}
    {#each filteredRules as rule (rule.id)}
      <ImportRuleListItem {rule} />
    {/each}
  {/if}
</div>
