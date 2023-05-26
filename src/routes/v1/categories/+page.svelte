<script lang="ts">
  import { goto } from '$app/navigation';
  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';
  import GridCircleItem from '$lib/ui/GridCircleItem.svelte';

  import type { PageData } from './$types';

  export let data: PageData;
  $: incomings = data.categories.filter((c) => c.type === 'IN');
  $: outgoings = data.categories.filter((c) => c.type === 'OUT');
</script>

<h2>{$translate('categories.incomings')}</h2>
<div class="grid px-1 mb-1">
  {#each incomings as category (category.id)}
    <GridCircleItem
      onClick={() => goto(`${routes.categories.path}/${category.id}`)}
      icon={category.icon || 'mdi:folder-outline'}
      text={category.name}
    />
  {/each}
  <GridCircleItem
    onClick={() => goto(`${routes['categories.create'].path}?type=IN`)}
    text={$translate('common.add')}
    icon="mdi:plus"
    dashed
  />
</div>

<h2 class="mt-2">{$translate('categories.outgoings')}</h2>
<div class="grid px-1">
  {#each outgoings as category (category.id)}
    <GridCircleItem
      onClick={() => goto(`${routes.categories.path}/${category.id}`)}
      icon={category.icon || 'mdi:folder-outline'}
      text={category.name}
    />
  {/each}
  <GridCircleItem
    onClick={() => goto(`${routes['categories.create'].path}?type=OUT`)}
    text={$translate('common.add')}
    icon="mdi:plus"
    dashed
  />
</div>

<style>
  h2 {
    text-align: center;
    font-weight: normal;
    font-size: 1.15rem;
  }
  .grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.25rem;
  }
</style>
