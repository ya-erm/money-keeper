<script lang="ts">
  import { groupingsStore } from '$lib/data';
  import type { Grouping } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';

  import GroupingListItem from './GroupingListItem.svelte';

  export let withUnselectedValue: boolean = false;
  export let onClick: (grouping: Grouping | null) => void;

  const groupings = $groupingsStore;
</script>

<ul class="flex-col gap-1">
  {#each groupings as grouping (grouping.id)}
    <li>
      <GroupingListItem {grouping} {onClick} />
    </li>
  {/each}
  {#if withUnselectedValue}
    <li>
      <GroupingListItem
        description={$translate('analytics.accounts.grouping.not_selected.description')}
        grouping={{ id: 'unselected', name: $translate('analytics.accounts.grouping.not_selected') }}
        onClick={() => onClick(null)}
        editable={false}
      />
    </li>
  {/if}
</ul>

<style>
  ul {
    margin: 0;
    padding: 1rem;
    list-style: none;
  }
</style>
