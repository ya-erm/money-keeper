<script lang="ts">
  import type { Category, CategoryType } from '$lib/data/interfaces';
  import { categoriesService } from '$lib/data/main';
  import { translate } from '$lib/translate';
  import CategoryList from './CategoryList.svelte';
  import CategoryModal from './CategoryModal.svelte';

  const categories = categoriesService.$categories;

  $: incomings = $categories.filter((x) => x.type === 'IN');
  $: outgoings = $categories.filter((x) => x.type === 'OUT');

  let opened = false;
  let category: Category | null = null;
  let categoryType: CategoryType = 'IN';

  const handleAdd = (type: CategoryType) => () => {
    categoryType = type;
    category = null;
    opened = true;
  };

  const handleClick = (item: Category) => {
    categoryType = item.type;
    category = item;
    opened = true;
  };

  const onSave = (item: Category) => {
    categoriesService.save(item);
  };

  const onDelete = (item: Category) => {
    categoriesService.delete(item);
  };
</script>

<h2>{$translate('categories.incomings')}</h2>
<CategoryList items={incomings} onClick={handleClick} onAdd={handleAdd('IN')} />

<h2 class="mt-2">{$translate('categories.outgoings')}</h2>
<CategoryList items={outgoings} onClick={handleClick} onAdd={handleAdd('OUT')} />

{#if opened}
  <CategoryModal bind:opened {category} {categoryType} {onSave} {onDelete} />
{/if}

<style>
  h2 {
    text-align: center;
    font-weight: normal;
    font-size: 1.15rem;
  }
</style>
