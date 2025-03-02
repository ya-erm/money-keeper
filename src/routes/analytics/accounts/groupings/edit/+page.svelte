<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { v4 as uuid } from 'uuid';

  import { groupingsService, groupingsStore } from '$lib/data';
  import type { Grouping } from '$lib/data/interfaces';
  import { route } from '$lib/routes';
  import { translate } from '$lib/translate';
  import HeaderBackButton from '$lib/ui/layout/HeaderBackButton.svelte';
  import Layout from '$lib/ui/layout/Layout.svelte';
  import { getSearchParam } from '$lib/utils';

  import EditGroupForm from './EditGroupForm.svelte';
  import GroupingNotFound from './GroupingNotFound.svelte';

  $: groupings = $groupingsStore;

  $: id = getSearchParam($page, 'id');

  let title = $translate('analytics.groupings.new_grouping');

  let notFound = false;
  let grouping: Grouping | null = null;

  onMount(() => {
    if (id) {
      grouping = groupings.find((item) => item.id === id) ?? null;
      if (!grouping) {
        notFound = true;
        return;
      }
      title = grouping.name;
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

<Layout {title} leftSlot={HeaderBackButton}>
  {#if notFound}
    <GroupingNotFound />
  {:else if grouping}
    <div class="p-1">
      <EditGroupForm {grouping} onSave={handleSave} />
    </div>
  {/if}
</Layout>
