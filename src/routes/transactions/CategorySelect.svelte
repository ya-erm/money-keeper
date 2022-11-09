<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import type { Category } from '@prisma/client';

  import type { CategoryType } from '$lib/interfaces';
  import { translate } from '$lib/translate';
  import GridCircleItem from '$lib/ui/GridCircleItem.svelte';

  import CreateCategoryModal from '../categories/create/CreateCategoryModal.svelte';

  export let withoutHeader = false;

  export let type: CategoryType;
  export let categories: Category[];

  export let categoryId: number | null = null;
  export let onChange: ((value: number) => void) | null = null;

  const handleChange = (value: number) => () => {
    categoryId = value;
    onChange?.(value);
  };

  let createCategoryModalOpened = false;
</script>

<div class="flex-col gap-0.5">
  {#if !withoutHeader}
    <label class="label">
      <span>{$translate('transactions.category')}</span>
      <input name="categoryId" value={categoryId} class="hidden" readonly required />
    </label>
  {/if}
  <div class="grid">
    {#each categories as category}
      <GridCircleItem
        selected={categoryId === category.id}
        onClick={handleChange(category.id)}
        icon={category.icon || 'mdi:briefcase-outline'}
        text={category.name}
      />
    {/each}
    <GridCircleItem
      onClick={() => (createCategoryModalOpened = true)}
      text={$translate('common.add')}
      icon="mdi:plus"
    />
  </div>
</div>

<CreateCategoryModal bind:opened={createCategoryModalOpened} {type} onCreate={invalidateAll} />

<style>
  .label {
    text-align: center;
  }
  .grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
  }
</style>
