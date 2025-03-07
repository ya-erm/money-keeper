<script lang="ts">
  import { page } from '$app/stores';
  import { onDestroy } from 'svelte';

  import { categoriesService, categoriesStore, memberSettingsStore, membersService } from '$lib/data';
  import type { Category } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import ModalContainer from '$lib/ui/ModalContainer.svelte';
  import Layout from '$lib/ui/layout/Layout.svelte';
  import { deleteSearchParam, getSearchParam } from '$lib/utils';

  import CategoryList from './CategoryList.svelte';
  import CategoryListButtons from './CategoryListButtons.svelte';
  import CategoryModal from './CategoryModal.svelte';

  $: categories = $categoriesStore;
  $: settings = $memberSettingsStore;

  $: incomings = categories.filter((x) => x.type === 'IN');
  $: outgoings = categories.filter((x) => x.type === 'OUT');

  let opened = false;
  let category: Category | null = null;

  $: action = getSearchParam($page, 'action');

  $: if (action === 'create') {
    category = null;
    opened = true;
  }

  $: if (action === 'create' && !opened) {
    void deleteSearchParam($page, 'action');
  }

  const onClick = (item: Category) => {
    saveCategoriesOrder();
    category = item;
    opened = true;
  };

  const onSave = (item: Category) => {
    saveCategoriesOrder();
    categoriesService.save(item);
  };

  const onDelete = (item: Category) => {
    saveCategoriesOrder();
    categoriesService.delete(item);
  };

  $: categoriesInOrder = settings?.categoriesInOrder ?? [];
  $: categoriesOutOrder = settings?.categoriesOutOrder ?? [];

  const saveCategoriesOrder = () => {
    if (
      categoriesInOrder.join(',') !== settings?.categoriesInOrder?.join(',') ||
      categoriesOutOrder.join(',') !== settings?.categoriesOutOrder?.join(',')
    ) {
      membersService.savCategoriesOrder(categoriesInOrder, categoriesOutOrder);
    }
  };

  onDestroy(() => {
    if (typeof window === 'undefined') return;
    saveCategoriesOrder();
  });
</script>

<Layout title={$translate('categories.title')} rightSlot={CategoryListButtons}>
  <h2>{$translate('categories.incomings')}</h2>
  <CategoryList items={incomings} {onClick} sortable onSort={(order) => (categoriesInOrder = order)} />

  <h2 class="mt-2">{$translate('categories.outgoings')}</h2>
  <CategoryList items={outgoings} {onClick} sortable onSort={(order) => (categoriesOutOrder = order)} />
</Layout>

{#if opened}
  <ModalContainer>
    <CategoryModal bind:opened {category} {onSave} {onDelete} />
  </ModalContainer>
{/if}

<style>
  h2 {
    text-align: center;
    font-weight: normal;
    font-size: 1.15rem;
  }
</style>
