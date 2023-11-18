<script lang="ts">
  import { page } from '$app/stores';
  import { categoriesService, categoriesStore } from '$lib/data';
  import type { Category } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import { useRightButton, useTitle } from '$lib/ui/header';
  import { deleteSearchParam, getSearchParam } from '$lib/utils';

  import AddCategoryButton from './AddCategoryButton.svelte';
  import CategoryList from './CategoryList.svelte';
  import CategoryModal from './CategoryModal.svelte';

  useTitle($translate('categories.title'));
  useRightButton(AddCategoryButton);

  let opened = false;

  $: action = getSearchParam($page, 'action');

  $: if (action === 'create') {
    category = null;
    opened = true;
  }
  $: if (!!action && !opened) {
    deleteSearchParam($page, 'action');
  }

  $: categories = $categoriesStore;

  $: incomings = categories.filter((x) => x.type === 'IN');
  $: outgoings = categories.filter((x) => x.type === 'OUT');

  let category: Category | null = null;

  const handleClick = (item: Category) => {
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
<CategoryList items={incomings} onClick={handleClick} />

<h2 class="mt-2">{$translate('categories.outgoings')}</h2>
<CategoryList items={outgoings} onClick={handleClick} />

{#if opened}
  <CategoryModal bind:opened {category} {onSave} {onDelete} />
{/if}

<style>
  h2 {
    text-align: center;
    font-weight: normal;
    font-size: 1.15rem;
  }
</style>
