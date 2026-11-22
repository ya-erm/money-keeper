<script lang="ts">
  import { participantsService, participantsStore, selectedParticipantStore } from '#lib/data/participants.js';
  import { translate } from '#lib/translate/index.js';
  import { showErrorToast } from '@ya-erm/svelte-ui/toasts';
  async function select(id: string) {
    try {
      await participantsService.select(id);
    } catch {
      showErrorToast($translate('wallets.save_failed'));
    }
  }
</script>

{#if $participantsStore.length}
  <label class="picker"
    ><span>{$translate('wallets.participant')}</span>
    <select
      data-testId="ParticipantPicker"
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
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 0.9rem;
  }
  select {
    max-width: 100%;
    min-height: 2.75rem;
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 0.6rem;
    background: var(--background-color);
    color: var(--primary-text-color);
    font: inherit;
  }
</style>
