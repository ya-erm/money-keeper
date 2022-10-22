<script lang="ts">
  import { goto } from '$app/navigation';
  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import NoItems from '$lib/ui/NoItems.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  const { groups } = data;

  const selectGroup = (id: number) => () => {
    goto(`${routes.groups.path}/${id}`);
  };

  const addGroup = () => {
    goto(routes['groups.create'].path);
  };
</script>

<div class="groups-container">
  <div class="groups-list">
    {#if !groups.length}
      <NoItems />
    {/if}
    {#each groups as group}
      <Button on:click={selectGroup(group.id)} color="white" bordered>{group.name}</Button>
    {/each}
    <Button on:click={addGroup}>{$translate('common.add')}</Button>
  </div>
</div>

<style>
  .groups-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .groups-list {
    width: 200px;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>
