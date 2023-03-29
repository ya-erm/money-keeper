<script lang="ts">
  import { categories, deleteCategory, saveCategory } from '$lib/data/categories';
  import type { Category, CategoryType } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import CategoryList from './CategoryList.svelte';
  import CategoryModal from './CategoryModal.svelte';

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
    category = item;
    opened = true;
  };
</script>

<h2>{$translate('categories.incomings')}</h2>
<CategoryList items={incomings} onClick={handleClick} onAdd={handleAdd('IN')} />

<h2 class="mt-2">{$translate('categories.outgoings')}</h2>
<CategoryList items={outgoings} onClick={handleClick} onAdd={handleAdd('OUT')} />

{#if opened}
  <CategoryModal bind:opened {category} {categoryType} onSave={saveCategory} onDelete={deleteCategory} />
{/if}

<style>
  h2 {
    text-align: center;
    font-weight: normal;
    font-size: 1.15rem;
  }
</style>
