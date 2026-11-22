<script lang="ts">
  import { $initialized as dataInitialized } from '#lib/data/initialized.js';
  import { goto } from '$app/navigation';
  import { page } from '#lib/page.js';
  import { selectedParticipantStore } from '#lib/data/participants.js';
  import { translate } from '#lib/translate/index.js';
  import HeaderButton from '#lib/ui/layout/HeaderButton.svelte';
  $: sortable = $page.url.searchParams.get('action') === 'sort';
</script>

<div class="flex">
  <HeaderButton
    icon="mdi:sort"
    label={$translate('wallets.sort')}
    disabled={!$dataInitialized || !$selectedParticipantStore}
    onClick={() => goto(sortable ? '/wallets/list' : '/wallets/list?action=sort', { replace: true })}
  />
  <HeaderButton
    icon="mdi:wallet-plus-outline"
    label={$translate('wallets.new')}
    href="/wallets/create?from=list"
    disabled={sortable}
  />
</div>
