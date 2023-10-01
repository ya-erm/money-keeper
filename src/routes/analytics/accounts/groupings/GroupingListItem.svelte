<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Grouping } from '$lib/data/interfaces';
  import { route } from '$lib/routes';
  import Button from '$lib/ui/Button.svelte';
  import Icon from '$lib/ui/Icon.svelte';

  export let grouping: Grouping;
  export let description = grouping.groups
    ?.map((group) => `${group.name} (${group.accountIds?.length ?? 0})`)
    .join(', ');

  // TODO: add sorting
  export let draggable = false;
  export let editable = true;

  export let onClick: (grouping: Grouping) => void = () => console.log('onClick', grouping);

  const handleClick = () => {
    if (draggable) {
      return;
    }
    onClick(grouping);
  };
</script>

<button
  type="button"
  data-id={grouping.id}
  aria-label={grouping.name}
  id={`grouping-list-item ${grouping.id}`}
  class="flex items-center"
  class:draggable
  on:click={handleClick}
>
  <div class="info flex-col gap-0.25">
    <div>{grouping.name}</div>
    <div class="description">{description}</div>
  </div>
  {#if editable}
    <Button
      appearance="link"
      underlined={false}
      on:click={() => goto(route('analytics.accounts.groupings.edit') + '?id=' + grouping.id)}
    >
      <Icon name="mdi:pencil" />
    </Button>
  {/if}
</button>

<style>
  button {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    border-radius: 1rem;
    background-color: var(--header-background-color);
    color: var(--primary-text-color);
    cursor: pointer;
    border: 1px solid var(--border-color);
    width: 100%;
    transition: box-shadow 0.2s ease-in-out;
    overflow: hidden;
  }
  @media (hover: hover) {
    button:hover {
      box-shadow: 0.25rem 0.25rem 0.5rem 0 rgba(0, 0, 0, 0.1);
    }
  }
  button.draggable {
    cursor: grab;
  }
  .info {
    flex-grow: 1;
    align-items: start;
    overflow: hidden;
  }
  .description {
    font-size: 0.85rem;
    white-space: nowrap;
    color: var(--secondary-text-color);
  }
</style>
