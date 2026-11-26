<script lang="ts">
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { v4 as uuid } from 'uuid';
  import Button from '@ya-erm/svelte-ui/Button';
  import Input from '@ya-erm/svelte-ui/Input';
  import { showErrorToast } from '@ya-erm/svelte-ui/toasts';
  import { accountsStore } from '#lib/data/accounts.js';
  import { participantsService, participantsStore, selectedParticipantStore } from '#lib/data/participants.js';
  import { membersService } from '#lib/data/members.js';
  import type { Participant } from '#lib/data/interfaces.js';
  import { translate } from '#lib/translate/index.js';
  import Layout from '#lib/ui/layout/Layout.svelte';
  import HeaderFormSubmitButton from '#lib/ui/layout/HeaderFormSubmitButton.svelte';
  import Modal from '#lib/ui/Modal.svelte';
  import ParticipantAvatar from './ParticipantAvatar.svelte';
  import SubScreen from '#lib/ui/layout/SubScreen.svelte';
  import CategoryIcons from '../../routes/categories/CategoryIcons.svelte';
  import { normalizeAvatarColor, participantAvatarAppearance, participantIcons } from './participantAvatar';
  import { prepareAvatarImage, uploadAvatarImage } from './avatarImage';
  import ListSelectItem from '#lib/ui/list/ListSelectItem.svelte';
  import GridCircleItem from '#lib/ui/GridCircleItem.svelte';
  export let creating = false;
  export let id: string | null = null;
  let draft: Participant = { id: uuid(), name: '', allocationPreset: 'first' };
  let initializedId: string | null = null;
  let busy = false;
  let deleteOpened = false;
  let iconSelecting = false;
  let colorSelecting = false;
  let photoInput: HTMLInputElement;
  let pendingPhoto: Blob | undefined;
  let photoPreview: string | undefined;
  let readingPhoto = false;
  let destroyed = false;
  onDestroy(() => {
    destroyed = true;
    if (photoPreview) URL.revokeObjectURL(photoPreview);
  });
  function clearPhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    pendingPhoto = undefined;
    photoPreview = undefined;
    draft = { ...draft, avatarId: undefined };
  }
  async function choosePhoto() {
    const file = photoInput.files?.[0];
    photoInput.value = '';
    if (!file || busy || readingPhoto) return;
    readingPhoto = true;
    try {
      const image = await prepareAvatarImage(file);
      if (destroyed) return;
      clearPhoto();
      pendingPhoto = image;
      photoPreview = URL.createObjectURL(image);
      iconSelecting = false;
    } catch {
      showErrorToast($translate('wallets.avatar_invalid_image'));
    } finally {
      readingPhoto = false;
    }
  }
  $: appearance = participantAvatarAppearance(draft);
  $: participant = creating ? undefined : $participantsStore.find((item) => item.id === id);
  $: if (participant && initializedId !== participant.id) {
    // Keep in-progress preferences when synchronization updates this participant.
    // eslint-disable-next-line no-useless-assignment
    initializedId = participant.id;
    draft = { ...participant, allocationPreset: participant.allocationPreset ?? 'first' };
  }
  async function save() {
    if (busy || readingPhoto || !draft.name.trim() || (!creating && !participant)) return;
    busy = true;
    try {
      const current = creating ? undefined : participantsService.getById(draft.id);
      if (!creating && !current) throw new Error('Participant is no longer available');
      if (pendingPhoto) {
        const owner = membersService.getSelectedMember().uuid;
        if (membersService.isGuest) throw new Error('sign_in');
        const avatarId = await uploadAvatarImage(pendingPhoto, owner);
        draft = { ...draft, avatarId };
        pendingPhoto = undefined;
      }
      await participantsService.save({
        ...current,
        ...draft,
        name: draft.name.trim(),
        avatarColor: normalizeAvatarColor(draft.avatarColor),
        avatarIcon: draft.avatarIcon?.trim() || undefined,
        currency: current?.currency,
        accountsOrder: creating ? $accountsStore.map((item) => item.id) : current?.accountsOrder,
        walletsOrder: current?.walletsOrder,
      });
      if (creating && !$selectedParticipantStore) await participantsService.select(draft.id);
      await goto('/settings/participants', { replace: true });
    } catch (error) {
      showErrorToast(
        $translate(
          error instanceof Error && error.message === 'sign_in' ? 'wallets.avatar_sign_in' : 'wallets.save_failed',
        ),
      );
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
      <div class="avatar-preview">
        <button
          type="button"
          class="avatar-button"
          disabled={busy}
          aria-label={$translate('wallets.avatar_select')}
          data-testId="ParticipantIconButton"
          on:click={() => (iconSelecting = true)}
        >
          <ParticipantAvatar participant={draft} preview={photoPreview} />
          <span>{$translate('wallets.avatar_select')}</span>
        </button>
      </div>
      <Input
        label={$translate('wallets.participant_name')}
        name="participant-name"
        bind:value={draft.name}
        required
        maxlength={100}
      />
      <ListSelectItem
        icon="mdi:palette-outline"
        title={$translate('wallets.avatar_color')}
        value={draft.avatarColor ?? $translate('wallets.avatar_auto_color')}
        onClick={() => {
          if (!busy && !readingPhoto) colorSelecting = true;
        }}
      />
      <label
        >{$translate('wallets.default_allocation')}
        <select name="allocation-preset" bind:value={draft.allocationPreset}>
          <option value="first">{$translate('wallets.first_wallet')}</option>
          <option value="other">{$translate('wallets.other_wallet')}</option>
          <option value="equal">{$translate('wallets.equal')}</option>
        </select>
      </label>
      <Button
        type="submit"
        disabled={busy || readingPhoto}
        text={$translate(readingPhoto ? 'wallets.avatar_processing' : 'common.save')}
      />
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
{#if iconSelecting}<SubScreen
    visible
    title={$translate('wallets.avatar_select')}
    onBack={() => (iconSelecting = false)}
    testId="ParticipantIconPicker"
  >
    <div class="p-1">
      <input
        type="file"
        accept="image/*"
        bind:this={photoInput}
        on:change={choosePhoto}
        hidden
        data-testId="ParticipantPhotoInput"
      />
      <Button
        disabled={readingPhoto}
        text={$translate(readingPhoto ? 'wallets.avatar_processing' : 'wallets.avatar_upload')}
        onClick={() => photoInput.click()}
      />
      <p class="photo-hint">{$translate('wallets.avatar_photo_hint')}</p>
    </div>
    <CategoryIcons
      icon={draft.avatarIcon ?? null}
      icons={participantIcons}
      allowEmpty
      onSelect={(value) => {
        if (readingPhoto) return;
        clearPhoto();
        draft = { ...draft, avatarIcon: value?.trim() || undefined };
        iconSelecting = false;
      }}
    />
  </SubScreen>{/if}
{#if colorSelecting}<SubScreen
    visible
    title={$translate('wallets.avatar_color')}
    onBack={() => (colorSelecting = false)}
    testId="ParticipantColorPicker"
  >
    <div class="p-1 flex-col gap-1 items-center">
      <GridCircleItem
        icon="mdi:palette-outline"
        text={$translate('wallets.avatar_auto_color')}
        selected={!draft.avatarColor}
        testId="ParticipantAutomaticColor"
        onClick={() => {
          draft = { ...draft, avatarColor: undefined };
          colorSelecting = false;
        }}
      />
      <Input
        label={$translate('wallets.avatar_custom_color')}
        type="color"
        name="participant-avatar-color"
        value={appearance.background}
        onChange={(value) => (draft = { ...draft, avatarColor: value })}
      />
      <Button text={$translate('common.continue')} onClick={() => (colorSelecting = false)} />
    </div>
  </SubScreen>{/if}
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
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
  }
  .avatar-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border: 0;
    background: transparent;
    color: var(--active-color);
    font: inherit;
    cursor: pointer;
  }
  .photo-hint {
    color: var(--secondary-text-color);
    font-size: 0.85rem;
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
