<script lang="ts">
  import { goto } from '$app/navigation';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import Button from '@ya-erm/svelte-ui/Button';
  import { showErrorToast } from '@ya-erm/svelte-ui/toasts';
  import { participantsService, participantsStore, selectedParticipantStore } from '#lib/data/participants.js';
  import { translate } from '#lib/translate/index.js';
  import Layout from '#lib/ui/layout/Layout.svelte';
  import ParticipantAvatar from './ParticipantAvatar.svelte';
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

<Layout title={$translate('wallets.participants')} onBack={() => goto('/settings')}>
  <div class="participants-page" data-testId="ParticipantsPage">
    <p class="hint">{$translate('wallets.participant')}</p>
    <ul>
      {#each $participantsStore.filter((participant) => !participant.archived) as participant (participant.id)}
        {@const selected = $selectedParticipantStore?.id === participant.id}
        <li class:selected data-testId="ParticipantRow" data-id={participant.id}>
          <button
            class="select"
            type="button"
            disabled={busy}
            aria-pressed={selected}
            aria-label={`${$translate('wallets.select_participant')} ${participant.name}`}
            data-testId="ParticipantSelect"
            on:click={() => select(participant.id)}
          >
            <ParticipantAvatar {participant} />
            <span class="identity"
              ><strong>{participant.name}</strong>{#if selected}<span class="hint"
                  >{$translate('wallets.selected_participant')}</span
                >{/if}</span
            >
            {#if selected}<span class="selected-icon" aria-hidden="true"
                ><Icon name="mdi:check-circle-outline" size={1.25} /></span
              >{/if}
          </button>
          <a
            class="edit"
            href={`/settings/participants/edit?id=${encodeURIComponent(participant.id)}`}
            aria-label={`${$translate('common.edit')} ${participant.name}`}><Icon name="mdi:pencil" size={1.25} /></a
          >
        </li>
      {:else}<li class="empty">{$translate('wallets.no_participants')}</li>{/each}
    </ul>
    <a class="add" href="/settings/participants/create"
      ><Icon name="mdi:plus" size={1.25} />{$translate('wallets.new_participant')}</a
    >
    {#if $selectedParticipantStore}<Button
        bordered
        appearance="transparent"
        color="secondary"
        disabled={busy}
        text={$translate('wallets.clear_participant')}
        onClick={() => select('')}
      />{/if}
  </div>
</Layout>

<style>
  .participants-page {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 36rem;
    margin: auto;
    padding: 1rem;
  }
  .hint {
    color: var(--secondary-text-color);
    font-size: 0.85rem;
    margin: 0;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  li {
    display: flex;
    align-items: center;
    border: 1px solid var(--border-color);
    border-radius: 1rem;
    background: var(--header-background-color);
  }
  li.selected {
    border-color: var(--active-color);
    box-shadow: 0 0 0 1px var(--active-color);
    background: var(--hover-background-color);
  }
  .select {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
    min-width: 0;
    padding: 0.85rem;
    background: transparent;
    border: 0;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
    border-radius: 1rem;
  }
  .identity {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  strong {
    font-weight: 500;
  }
  .selected-icon {
    display: inline-flex;
    color: var(--active-color);
    flex-shrink: 0;
  }
  .edit {
    padding: 0.75rem;
    color: var(--active-color);
    display: inline-flex;
    flex-shrink: 0;
  }
  .add {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    padding: 0.8rem;
    border-radius: 0.75rem;
    color: var(--background-color);
    background: var(--active-color);
    text-decoration: none;
  }
  .empty {
    padding: 1rem;
  }
</style>
