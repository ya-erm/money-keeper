<script lang="ts">
  import { $initialized as dataInitialized } from '#lib/data/initialized.js';
  import { goto } from '$app/navigation';
  import { page } from '#lib/page.js';

  import { participantsStore, selectedParticipantStore } from '#lib/data/participants.js';
  import { translate } from '#lib/translate/index.js';
  import HeaderButton from '#lib/ui/layout/HeaderButton.svelte';
  import { getSearchParam } from '#lib/utils/index.js';

  $: action = getSearchParam($page, 'action');
  const handleSortClick = async () => {
    if (action === 'sort') {
      await goto('?', { replace: true });
    } else {
      await goto('?action=sort', { replace: true });
    }
  };
</script>

<div class="flex">
  <HeaderButton
    icon="mdi:sort"
    label={$translate('accounts.sort')}
    onClick={handleSortClick}
    disabled={!$dataInitialized || ($participantsStore.some((item) => !item.archived) && !$selectedParticipantStore)}
  />

  <HeaderButton
    icon="mdi:credit-card-plus-outline"
    href="?action=create"
    label={$translate('accounts.create_account')}
    disabled={action === 'sort'}
  />
</div>
