<script lang="ts">
  import type { Category } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import GridCircleItem from '$lib/ui/GridCircleItem.svelte';

  export let items: Category[];

  export let onClick: (category: Category) => void = () => {};
  export let onAdd: () => void = () => {};
</script>

<div class="grid px-1 mb-1">
  {#each items as category (category.id)}
    <GridCircleItem
      onClick={() => onClick(category)}
      icon={category.icon || 'mdi:folder-outline'}
      text={category.name}
    />
  {/each}
  <GridCircleItem onClick={onAdd} text={$translate('common.add')} icon="mdi:plus" dashed />
</div>

<style>
  .grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.25rem;
  }
</style>
