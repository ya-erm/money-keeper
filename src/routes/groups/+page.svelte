<script lang="ts">
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import Loading from '$lib/Loading.svelte';
  import { routes } from '$lib/store/routes';
  import { groupId } from '$lib/store/user';

  const fetchGroups = api.groups.getGroups();

  const selectGroup = (id: number) => () => {
    groupId.set(id);
    goto(`${routes.groups.path}/${id}`);
    // goto(routes.accounts.path);
  };

  const addGroup = () => {
    goto(routes['groups.create'].path);
  };
</script>

<div class="groups-container">
  {#await fetchGroups}
    <Loading />
  {:then groups}
    <div class="groups-list">
      {#each groups.data.items as group}
        <button on:click={selectGroup(group.id)} class="groups-list-item">{group.name}</button>
      {/each}
      <button on:click={addGroup} class="groups-list-item create">Add</button>
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
  .groups-list-item {
    font-size: 1rem;
    list-style-type: none;
    text-align: center;
    padding: 0.75rem;
    border-radius: 0.75rem;
    background: var(--header-background-color);
    border: 1px solid var(--border-color);
  }
  .groups-list-item:hover {
    cursor: pointer;
    opacity: 0.9;
  }
  .groups-list-item:active {
    opacity: 0.8;
  }
  .groups-list-item.create {
    background: none;
    color: var(--secondary-text-color);
    border: 2px dashed var(--border-color);
  }
</style>
