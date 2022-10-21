<script lang="ts">
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import { routes } from '$lib/routes';
  import Button from '$lib/ui/Button.svelte';
  import Loading from '$lib/ui/Loading.svelte';

  const fetchGroups = api.groups.getGroups();

  const selectGroup = (id: number) => () => {
    goto(`${routes.groups.path}/${id}`);
  };

  const addGroup = () => {
    goto(routes['groups.create'].path);
  };
</script>

<div class="groups-container">
  {#await fetchGroups}
    <Loading />
  {:then response}
    <div class="groups-list">
      {#each response.data.items as group}
        <Button on:click={selectGroup(group.id)} color="white" bordered>{group.name}</Button>
      {/each}
      <Button on:click={addGroup}>Add</Button>
    </div>
  {/await}
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
