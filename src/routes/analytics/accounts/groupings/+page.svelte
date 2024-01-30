<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Group } from '$lib/data/interfaces';
  import { route } from '$lib/routes';
  import { useBackButton, useRightButton } from '$lib/ui/header/model';

  import AddGroupingButton from './AddGroupingButton.svelte';
  import GroupingList from './GroupingList.svelte';

  useBackButton(route('analytics.accounts'));
  useRightButton(AddGroupingButton);

  const onClick = async (group: Group | null) => {
    if (group) {
      await goto(route('analytics.accounts.groupings.edit') + '?id=' + group.id);
    }
  };
</script>

<GroupingList {onClick} />
