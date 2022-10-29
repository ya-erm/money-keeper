<script lang="ts">
  import { goto } from '$app/navigation';
  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';
  import GridCircleItem from '$lib/ui/GridCircleItem.svelte';

  import type { PageData } from './$types';

  export let data: PageData;
  $: categories = data.categories;
</script>

<div class="grid p-1">
  {#each categories as category (category.id)}
    <GridCircleItem
      onClick={() => goto(`${routes.categories.path}/${category.id}`)}
      icon={category.icon || 'mdi:folder-outline'}
      text={category.name}
    />
  {/each}
  <GridCircleItem
    onClick={() => goto(routes['categories.create'].path)}
    text={$translate('common.add')}
    icon="mdi:plus"
  />
</div>

<style>
  .grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
  }
</style>
