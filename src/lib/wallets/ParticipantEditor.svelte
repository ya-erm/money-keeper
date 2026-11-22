<script lang="ts">
  import { goto } from '$app/navigation';
  import { v4 as uuid } from 'uuid';
  import Button from '@ya-erm/svelte-ui/Button';
  import Input from '@ya-erm/svelte-ui/Input';
  import { showErrorToast } from '@ya-erm/svelte-ui/toasts';
  import { accountsStore } from '#lib/data/accounts.js';
  import { walletsStore } from '#lib/data/wallets.js';
  import { participantsService, participantsStore, selectedParticipantStore } from '#lib/data/participants.js';
  import type { Participant } from '#lib/data/interfaces.js';
  import { translate } from '#lib/translate/index.js';
  import Layout from '#lib/ui/layout/Layout.svelte';
  import HeaderFormSubmitButton from '#lib/ui/layout/HeaderFormSubmitButton.svelte';
  import Modal from '#lib/ui/Modal.svelte';
  import ParticipantAvatar from './ParticipantAvatar.svelte';
  import { orderedItems } from './calculations';
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
  $: accounts = orderedItems($accountsStore, draft.accountsOrder);
  $: wallets = orderedItems($walletsStore, draft.walletsOrder);
  function move(kind: 'accountsOrder' | 'walletsOrder', id: string, shift: number) {
    const ids = (kind === 'accountsOrder' ? accounts : wallets).map((item) => item.id);
    const position = ids.indexOf(id),
      next = position + shift;
    if (next < 0 || next >= ids.length) return;
    [ids[position], ids[next]] = [ids[next], ids[position]];
    draft = { ...draft, [kind]: ids };
  }
  function setVisible(kind: 'hiddenAccountIds' | 'hiddenWalletIds', id: string, shown: boolean) {
    const ids = draft[kind] ?? [];
    draft = { ...draft, [kind]: shown ? ids.filter((value) => value !== id) : [...new Set([...ids, id])] };
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
        accountsOrder: draft.accountsOrder ?? (creating ? accounts.map((item) => item.id) : current?.accountsOrder),
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
      <p class="hint">{$translate('wallets.order_hint')}</p>
      {#each ['accountsOrder', 'walletsOrder'] as kind (kind)}
        {@const items = kind === 'accountsOrder' ? accounts : wallets}
        {#if items.length}<section class="preferences" data-testId="ParticipantPreferences">
            <h2>{$translate(kind === 'accountsOrder' ? 'accounts.title' : 'wallets.title')}</h2>
            {#each items as item, index (item.id)}
              <div class="preference-row">
                <label class="visibility"
                  ><input
                    type="checkbox"
                    aria-label={`${$translate('wallets.visible')} ${item.name}`}
                    checked={!(kind === 'accountsOrder' ? draft.hiddenAccountIds : draft.hiddenWalletIds)?.includes(
                      item.id,
                    )}
                    on:change={(event) =>
                      setVisible(
                        kind === 'accountsOrder' ? 'hiddenAccountIds' : 'hiddenWalletIds',
                        item.id,
                        event.currentTarget.checked,
                      )}
                  />{item.name}</label
                >
                <button
                  type="button"
                  aria-label={`${$translate('wallets.up')} ${item.name}`}
                  disabled={busy || index === 0}
                  on:click={() => move(kind as 'accountsOrder' | 'walletsOrder', item.id, -1)}>↑</button
                >
                <button
                  type="button"
                  aria-label={`${$translate('wallets.down')} ${item.name}`}
                  disabled={busy || index === items.length - 1}
                  on:click={() => move(kind as 'accountsOrder' | 'walletsOrder', item.id, 1)}>↓</button
                >
              </div>
            {/each}
          </section>{/if}
      {/each}
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
  .hint {
    margin: 0;
    color: var(--secondary-text-color);
    font-size: 0.85rem;
  }
  .preferences {
    border: 1px solid var(--border-color);
    border-radius: 1rem;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 500;
  }
  .preference-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .visibility {
    flex: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .visibility input {
    flex-shrink: 0;
    width: 1.2rem;
    height: 1.2rem;
  }
  .preference-row button {
    font: inherit;
    min-width: 2.75rem;
    min-height: 2.75rem;
    border: 1px solid var(--border-color);
    border-radius: 0.65rem;
    color: var(--primary-text-color);
    background: var(--header-background-color);
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.4;
  }
</style>
