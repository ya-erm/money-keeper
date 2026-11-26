<script lang="ts">
  import { goto } from '$app/navigation';
  import { v4 as uuid } from 'uuid';
  import Button from '@ya-erm/svelte-ui/Button';
  import Input from '@ya-erm/svelte-ui/Input';
  import { showErrorToast } from '@ya-erm/svelte-ui/toasts';
  import { accountsStore } from '#lib/data/accounts.js';
  import { participantsService, participantsStore, selectedParticipantStore } from '#lib/data/participants.js';
  import type { Participant } from '#lib/data/interfaces.js';
  import { translate } from '#lib/translate/index.js';
  import Layout from '#lib/ui/layout/Layout.svelte';
  import HeaderFormSubmitButton from '#lib/ui/layout/HeaderFormSubmitButton.svelte';
  import Modal from '#lib/ui/Modal.svelte';
  import ParticipantAvatar from './ParticipantAvatar.svelte';
  export let creating = false;
  export let id: string | null = null;
  let draft: Participant = { id: uuid(), name: '', allocationPreset: 'first' };
  let initializedId: string | null = null;
  let busy = false;
  let deleteOpened = false;
  $: participant = creating ? undefined : $participantsStore.find((item) => item.id === id);
  $: if (participant && initializedId !== participant.id) {
    // Keep in-progress preferences when synchronization updates this participant.
    // eslint-disable-next-line no-useless-assignment
    initializedId = participant.id;
    draft = { ...participant, allocationPreset: participant.allocationPreset ?? 'first' };
  }
  async function save() {
    if (busy || !draft.name.trim() || (!creating && !participant)) return;
    busy = true;
    try {
      const current = creating ? undefined : participantsService.getById(draft.id);
      if (!creating && !current) throw new Error('Participant is no longer available');
      await participantsService.save({
        ...current,
        ...draft,
        name: draft.name.trim(),
        currency: current?.currency,
        accountsOrder: creating ? $accountsStore.map((item) => item.id) : current?.accountsOrder,
        walletsOrder: current?.walletsOrder,
      });
      if (creating && !$selectedParticipantStore) await participantsService.select(draft.id);
      await goto('/settings/participants', { replace: true });
    } catch {
      showErrorToast($translate('wallets.save_failed'));
    } finally {
      busy = false;
    }
  }
  async function remove() {
    const current = participantsService.getById(draft.id);
    if (busy || !current) return;
    const wasSelected = $selectedParticipantStore?.id === current.id;
    busy = true;
    try {
      await participantsService.save({ ...current, deleted: true });
      if (wasSelected) await participantsService.select('');
      deleteOpened = false;
      await goto('/settings/participants', { replace: true });
    } catch {
      showErrorToast($translate('wallets.save_failed'));
    } finally {
      busy = false;
    }
  }
</script>

<Layout
  title={$translate(creating ? 'wallets.new_participant' : 'wallets.edit_participant')}
  onBack={() => goto('/settings/participants')}
  rightSlot={HeaderFormSubmitButton}
  hideMenu
>
  {#if creating || participant}
    <form class="participant-form flex-col gap-1" data-testId="ParticipantForm" on:submit|preventDefault={save}>
      <div class="avatar-preview"><ParticipantAvatar participant={draft} /></div>
      <Input
        label={$translate('wallets.participant_name')}
        name="participant-name"
        bind:value={draft.name}
        required
        maxlength={100}
      />
      <label
        >{$translate('wallets.default_allocation')}
        <select name="allocation-preset" bind:value={draft.allocationPreset}>
          <option value="first">{$translate('wallets.first_wallet')}</option>
          <option value="other">{$translate('wallets.other_wallet')}</option>
          <option value="equal">{$translate('wallets.equal')}</option>
        </select>
      </label>
      <Button type="submit" disabled={busy} text={$translate('common.save')} />
      {#if !creating}<Button
          color="danger"
          appearance="transparent"
          bordered
          disabled={busy}
          text={$translate('common.delete')}
          onClick={() => (deleteOpened = true)}
        />{:else}<Button
          color="secondary"
          appearance="transparent"
          bordered
          disabled={busy}
          text={$translate('common.cancel')}
          onClick={() => goto('/settings/participants')}
        />{/if}
    </form>
  {:else}<div class="participant-form">
      <p>{$translate('wallets.participant_not_found')}</p>
      <a href="/settings/participants">{$translate('common.back')}</a>
    </div>{/if}
</Layout>
<Modal bind:opened={deleteOpened} width={22} header={$translate('wallets.delete_participant_confirm')}>
  <p>{$translate('wallets.delete_participant_description')}</p>
  <div class="mt-1 grid-col-2 gap-1" data-testId="DeleteParticipantConfirmation">
    <Button color="danger" disabled={busy} text={$translate('common.delete')} onClick={remove} />
    <Button
      color="white"
      bordered
      disabled={busy}
      text={$translate('common.cancel')}
      onClick={() => (deleteOpened = false)}
    />
  </div>
</Modal>

<style>
  .participant-form {
    max-width: 30rem;
    margin: auto;
    padding: 1rem;
  }
  .avatar-preview {
    display: flex;
    justify-content: center;
    padding: 0.5rem;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  select {
    font: inherit;
    min-height: 2.75rem;
    width: 100%;
    padding: 0.6rem;
    border: 1px solid var(--border-color);
    border-radius: 0.65rem;
    background: var(--header-background-color);
    color: var(--primary-text-color);
  }
</style>
