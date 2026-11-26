<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { mainService } from '#lib/data/main.js';
  import { selectedParticipantStore } from '#lib/data/participants.js';
  import { walletsStore } from '#lib/data/wallets.js';
  import { orderedItems } from '#lib/wallets/calculations.js';
  import { membersService } from '#lib/data/members.js';

  onMount(async () => {
    await mainService.init();
    const participant = get(selectedParticipantStore);
    const wallet = orderedItems(
      get(walletsStore).filter((wallet) => !wallet.archived),
      participant?.walletsOrder,
    )[0];
    await goto(
      membersService.selectedMemberSettings?.walletsEnabled && participant && wallet
        ? `/wallets?wallet=${wallet.id}`
        : '/accounts',
      { replace: true },
    );
  });
</script>
