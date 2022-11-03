<script lang="ts">
  import type { Category } from '@prisma/client';

  import { translate } from '$lib/translate';
  import GridCircleItem from '$lib/ui/GridCircleItem.svelte';

  export let categories: Category[];

  export let categoryId: number | null = null;
</script>

<div class="flex-col gap-0.5">
  <label class="label">
    <span>{$translate('transactions.category')}</span>
    <input name="categoryId" value={categoryId} class="hidden" readonly required />
  </label>
  <div class="grid">
    {#each categories as category}
      <GridCircleItem
        selected={categoryId === category.id}
        onClick={() => (categoryId = category.id)}
        icon={category.icon || 'mdi:briefcase-outline'}
        text={category.name}
      />
    {/each}
  </div>
</div>

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
