<script lang="ts">
  import { dndzone, type DndEvent } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';

  import type { Category } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import GridCircleItem from '$lib/ui/GridCircleItem.svelte';

  export let items: Category[];

  export let onClick: (category: Category) => void = () => {};
  export let onAdd: () => void = () => {};
  export let onSort: (order: string[]) => void = () => {};

  export let showAddButton = false;
  export let sortable = false;

  const flipDurationMs = 200;

  const handleDndConsider = (e: CustomEvent<DndEvent<Category>>) => {
    items = e.detail.items;
  };

  const handleDndFinalize = (e: CustomEvent<DndEvent<Category>>) => {
    items = e.detail.items;
    onSort(items.map(({ id }) => id));
  };
</script>

<ul
  class="grid px-1 mb-1"
  use:dndzone={{
    items,
    dragDisabled: !sortable,
    dropTargetStyle: {},
    flipDurationMs,
  }}
  on:consider={handleDndConsider}
  on:finalize={handleDndFinalize}
>
  {#if items.length === 0}
    <span class="no-data">{$translate('categories.no_data')}</span>
  {/if}
  {#each items as category (category.id)}
    <li class="flex-center" animate:flip={{ duration: flipDurationMs }}>
      <GridCircleItem
        onClick={() => onClick(category)}
        icon={category.icon || 'mdi:folder-outline'}
        text={category.name}
      />
    </li>
  {/each}
  {#if showAddButton}
    <GridCircleItem onClick={onAdd} text={$translate('common.add')} icon="mdi:plus" dashed />
  {/if}
</ul>

<style>
  ul {
    list-style: none;
    margin: 0;
  }
  li:focus-visible {
    outline: none;
  }
  .grid {
    display: grid;
    flex-wrap: wrap;
    justify-content: center;
    grid-template-columns: repeat(auto-fit, minmax(64px, 1fr));
    gap: 0.5rem;
  }
  .no-data {
    text-align: center;
    color: var(--secondary-text-color);
  }
</style>
