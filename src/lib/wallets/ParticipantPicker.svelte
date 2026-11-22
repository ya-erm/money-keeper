<script lang="ts">
  import { participantsService, participantsStore, selectedParticipantStore } from '#lib/data/participants.js';
  import { translate } from '#lib/translate/index.js';
  import { showErrorToast } from '@ya-erm/svelte-ui/toasts';
  let busy = false;
  async function select(id: string) {
    if (busy) return;
    busy = true;
    try {
      await participantsService.select(id);
    } catch {
      showErrorToast($translate('wallets.save_failed'));
    } finally {
      busy = false;
    }
  }
</script>

{#if $participantsStore.some((participant) => !participant.archived)}
  <label class="picker"
    ><span>{$translate('wallets.participant')}</span>
    <select
      data-testId="ParticipantPicker"
      disabled={busy}
      value={$selectedParticipantStore?.id ?? ''}
      on:change={(event) => select(event.currentTarget.value)}
    >
      <option value="">{$translate('wallets.no_participant')}</option>
      {#each $participantsStore.filter((item) => !item.archived) as participant (participant.id)}<option
          value={participant.id}>{participant.name}</option
        >{/each}
    </select>
  </label>
{/if}

<style>
  .picker {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.9rem;
  }
  select {
    width: 100%;
    box-sizing: border-box;
    min-height: 2.75rem;
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 0.6rem;
    background: var(--header-background-color);
    color: var(--primary-text-color);
    font: inherit;
  }
</style>
