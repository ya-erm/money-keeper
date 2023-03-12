<script lang="ts">
  import { invalidate } from '$app/navigation';
  import type { Category } from '@prisma/client';

  import { deps } from '$lib/deps';
  import type { CategoryType } from '$lib/interfaces';
  import { translate } from '$lib/translate';
  import GridCircleItem from '$lib/ui/GridCircleItem.svelte';

  import CreateCategoryModal from '../categories/create/CreateCategoryModal.svelte';

  export let withoutHeader = false;

  export let type: CategoryType | null = null;
  export let categories: Category[];

  export let categoryId: number | null = null;
  export let onChange: ((value: number) => void) | null = null;

  export let testId: string = 'CategorySelect';

  const handleChange = (value: number) => () => {
    categoryId = value;
    onChange?.(value);
  };

  let createCategoryModalOpened = false;
</script>

<div class="flex-col gap-0.5" data-testId={testId}>
  {#if !withoutHeader}
    <span class="flex-center" data-testId={`${testId}.Label`}>{$translate('transactions.category')}</span>
  {/if}
  <input name="categoryId" value={categoryId} class="hidden" readonly required />
  <div class="grid" data-testId={`${testId}.Grid`}>
    {#each categories as category (category.id)}
      <GridCircleItem
        selected={categoryId === category.id}
        onClick={handleChange(category.id)}
        testId={`${testId}.Item.${category.id}`}
        icon={category.icon || 'mdi:briefcase-outline'}
        text={category.name}
      />
    {/each}
    {#if !!type}
      <GridCircleItem
        testId={`${testId}.Item.Add`}
        onClick={() => (createCategoryModalOpened = true)}
        text={$translate('common.add')}
        icon="mdi:plus"
        dashed
      />
    {/if}
  </div>
</div>

{#if !!type}
  <CreateCategoryModal bind:opened={createCategoryModalOpened} {type} onCreate={() => invalidate(deps.categories)} />
{/if}

<style>
  .grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.25rem;
  }
</style>
