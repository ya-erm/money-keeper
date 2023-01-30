<script lang="ts">
  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import { backLink } from '$lib/ui/header';
  import NoItems from '$lib/ui/NoItems.svelte';

  import type { PageData } from './$types';

  backLink.set(routes.settings.path);

  export let data: PageData;

  const { groups, groupId } = data;
</script>

<div class="groups-container">
  <div class="groups-list">
    {#if !groups.length}
      <NoItems />
    {/if}
    {#each groups as group (group.id)}
      <a href={`${routes.groups.path}/${group.id}`} class="flex-col text-decoration-none">
        <Button color={group.id === groupId ? 'success' : 'white'} bordered text={group.name} />
      </a>
    {/each}
    <a href={routes['groups.create'].path} class="flex-col text-decoration-none">
      <Button text={$translate('common.add')} />
    </a>
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
