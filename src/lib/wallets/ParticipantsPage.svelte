<script lang="ts">
  import { goto } from '$app/navigation';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import { participantsStore, selectedParticipantStore } from '#lib/data/participants.js';
  import { translate } from '#lib/translate/index.js';
  import Layout from '#lib/ui/layout/Layout.svelte';
  import ParticipantAvatar from './ParticipantAvatar.svelte';
  import ParticipantPicker from './ParticipantPicker.svelte';
</script>

<Layout title={$translate('wallets.participants')} onBack={() => goto('/settings')}>
  <div class="participants-page" data-testId="ParticipantsPage">
    <ParticipantPicker />
    <ul>
      {#each $participantsStore.filter((participant) => !participant.archived) as participant (participant.id)}
        {@const selected = $selectedParticipantStore?.id === participant.id}
        <li class:selected data-testId="ParticipantRow" data-id={participant.id}>
          <a
            class="participant-link"
            href={`/settings/participants/edit?id=${encodeURIComponent(participant.id)}`}
            aria-label={`${$translate('common.edit')} ${participant.name}`}
          >
            <ParticipantAvatar {participant} />
            <strong>{participant.name}</strong>
            <span class="chevron" aria-hidden="true"><Icon name="mdi:chevron-right" size={1.25} /></span>
          </a>
        </li>
      {:else}<li class="empty">{$translate('wallets.no_participants')}</li>{/each}
    </ul>
    <a class="add" href="/settings/participants/create"
      ><Icon name="mdi:plus" size={1.25} />{$translate('wallets.new_participant')}</a
    >
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
  .participant-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    min-width: 0;
    padding: 0.85rem;
    border-radius: 1rem;
    color: inherit;
    text-decoration: none;
  }
  strong {
    font-weight: 500;
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .chevron {
    display: inline-flex;
    color: var(--secondary-text-color);
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
