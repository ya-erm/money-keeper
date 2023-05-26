<script lang="ts">
  import { categoriesService } from '$lib/data';
  import type { Category, CategoryType } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import GridCircleItem from '$lib/ui/GridCircleItem.svelte';

  import CategoryModal from '../../categories/CategoryModal.svelte';

  export let withoutHeader = false;

  export let type: CategoryType | null = null;
  export let categories: Category[];

  export let categoryId: string | null = null;
  export let onChange: ((value: string) => void) | null = null;

  export let testId: string = 'CategorySelect';

  const handleChange = (value: string) => () => {
    categoryId = value;
    onChange?.(value);
  };

  const handleSave = (item: Category) => {
    categoriesService.save(item);
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
  <CategoryModal bind:opened={createCategoryModalOpened} categoryType={type} onSave={handleSave} />
{/if}

<style>
  .grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.25rem;
  }
</style>
