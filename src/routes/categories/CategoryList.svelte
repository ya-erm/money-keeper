<script lang="ts">
  import type { Category } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import GridCircleItem from '$lib/ui/GridCircleItem.svelte';

  export let items: Category[];

  export let onClick: (category: Category) => void = () => {};
  export let onAdd: () => void = () => {};

  export let showAddButton = false;
</script>

<div class="grid px-1 mb-1">
  {#each items as category (category.id)}
    <GridCircleItem
      onClick={() => onClick(category)}
      icon={category.icon || 'mdi:folder-outline'}
      text={category.name}
    />
  {/each}
  {#if showAddButton}
    <GridCircleItem onClick={onAdd} text={$translate('common.add')} icon="mdi:plus" dashed />
  {/if}
</div>

<style>
  .grid {
    display: grid;
    flex-wrap: wrap;
    justify-content: center;
    grid-template-columns: repeat(auto-fit, minmax(64px, 1fr));
    gap: 0.5rem;
  }
</style>
