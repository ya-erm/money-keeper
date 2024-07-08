<script lang="ts">
  import { categoriesService } from '$lib/data';
  import type { Category, CategoryType } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import GridCircleItem from '$lib/ui/GridCircleItem.svelte';
  import InputLabel from '$lib/ui/InputLabel.svelte';
  import ModalContainer from '$lib/ui/ModalContainer.svelte';
  import resizeObserver from '$lib/utils/resizeObserver';

  import CategoryModal from '../../categories/CategoryModal.svelte';

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

  let grid: HTMLElement;
  let itemsInRow = 0;
  let rowsCount = 0;
  let showAll = false;

  const getRowsNumber = () => {
    if (grid) {
      const style = getComputedStyle(grid);
      itemsInRow = style.getPropertyValue('grid-template-columns').split(' ').length;
      rowsCount = Math.ceil((categories.length + 1) / itemsInRow);
      if (categoryId && categories.findIndex((category) => category.id === categoryId) >= itemsInRow * 2 - 1) {
        showAll = true;
      }
    }
  };

  $: showMoreButton = rowsCount > 2 && !showAll;
  $: filteredItems = showMoreButton ? categories.slice(0, itemsInRow * 2 - 1) : categories;
</script>

<div class="flex-col gap-0.5" data-testId={testId}>
  <InputLabel testId={`${testId}.Label`} text={$translate('transactions.category')} />
  <input name="categoryId" value={categoryId} class="hidden" readonly required />
  <div bind:this={grid} class="grid" data-testId={`${testId}.Grid`} use:resizeObserver={{ onResize: getRowsNumber }}>
    {#each filteredItems as category (category.id)}
      <GridCircleItem
        selected={categoryId === category.id}
        onClick={handleChange(category.id)}
        testId={`${testId}.Item`}
        dataId={category.id}
        icon={category.icon || 'mdi:briefcase-outline'}
        text={category.name}
      />
    {/each}
    {#if !!type && !showMoreButton}
      <GridCircleItem
        testId={`${testId}.Item.Add`}
        onClick={() => (createCategoryModalOpened = true)}
        text={$translate('common.add')}
        icon="mdi:plus"
        dashed
      />
    {/if}
    {#if showMoreButton}
      <GridCircleItem
        onClick={() => (showAll = true)}
        text={$translate('categories.more')}
        icon="mdi:chevron-down"
        dashed
      />
    {/if}
  </div>
</div>

{#if !!type && createCategoryModalOpened}
  <ModalContainer>
    <CategoryModal bind:opened={createCategoryModalOpened} categoryType={type} onSave={handleSave} />
  </ModalContainer>
{/if}

<style>
  .grid {
    display: grid;
    flex-wrap: wrap;
    justify-content: center;
    grid-template-columns: repeat(auto-fit, minmax(64px, 1fr));
    gap: 0.5rem;
  }
</style>
