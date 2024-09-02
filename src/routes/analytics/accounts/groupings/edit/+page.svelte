<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { v4 as uuid } from 'uuid';

  import { groupingsService, groupingsStore } from '$lib/data';
  import type { Grouping } from '$lib/data/interfaces';
  import { route } from '$lib/routes';
  import { translate } from '$lib/translate';
  import { useTitle } from '$lib/ui/header';
  import { title, useBackButton } from '$lib/ui/header/model';
  import { getSearchParam } from '$lib/utils';

  import EditGroupForm from './EditGroupForm.svelte';
  import GroupingNotFound from './GroupingNotFound.svelte';

  $: groupings = $groupingsStore;

  $: id = getSearchParam($page, 'id');

  useBackButton(route('analytics.accounts.groupings'), $translate('common.back'));
  useTitle($translate('analytics.groupings.new_grouping'));

  let notFound = false;
  let grouping: Grouping | null = null;

  onMount(() => {
    if (id) {
      grouping = groupings.find((item) => item.id === id) ?? null;
      if (!grouping) {
        notFound = true;
        return;
      }
      title.set(grouping.name);
    } else {
      grouping = {
        id: uuid(),
        name: '',
      };
    }
  });

  const handleSave = async (value: Grouping) => {
    groupingsService.save(value);
    await goto(route('analytics.accounts.groupings'));
  };
</script>

{#if notFound}
  <GroupingNotFound />
{:else if grouping}
  <div class="p-1">
    <EditGroupForm {grouping} onSave={handleSave} />
  </div>
{/if}
