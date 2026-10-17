<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Group } from '$lib/data/interfaces';
  import { route } from '$lib/routes';
  import { translate } from '$lib/translate';
  import HeaderBackButton from '$lib/ui/layout/HeaderBackButton.svelte';
  import Layout from '$lib/ui/layout/Layout.svelte';
  import Analytics from '../../Analytics.svelte';

  import AddGroupingButton from './AddGroupingButton.svelte';
  import GroupingList from './GroupingList.svelte';

  const onClick = async (group: Group | null) => {
    if (group) {
      await goto(route('analytics.accounts.groupings.edit') + '?id=' + group.id);
    }
  };
</script>

<Layout
  title={$translate('analytics.groupings.title')}
  leftSlot={HeaderBackButton}
  rightSlot={AddGroupingButton}
  section={Analytics}
  sectionTitle={$translate('analytics.title')}
>
  <GroupingList {onClick} />
</Layout>
