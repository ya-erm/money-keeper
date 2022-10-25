<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';

  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import NoItems from '$lib/ui/NoItems.svelte';

  import type { PageData } from './$types';

  export let data: PageData;

  const { groups, groupId } = data;

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
      <form
        class="flex-col"
        action="?/selectGroup"
        method="POST"
        use:enhance={() =>
          async ({ result }) => {
            await invalidateAll();
            await applyAction(result);
          }}
      >
        <input class="hidden" name="groupId" value={group.id} type="number" />
        <Button color={group.id === groupId ? 'success' : 'white'} type="submit" bordered>{group.name}</Button>
      </form>
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
    width: 18rem;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>
