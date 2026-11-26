<script lang="ts">
  import { goto } from '$app/navigation';
  import { v4 as uuid } from 'uuid';
  import Button from '@ya-erm/svelte-ui/Button';
  import Input from '@ya-erm/svelte-ui/Input';
  import { showErrorToast } from '@ya-erm/svelte-ui/toasts';
  import { page } from '#lib/page.js';
  import { walletsService, walletsStore } from '#lib/data/wallets.js';
  import { participantsService, participantsStore } from '#lib/data/participants.js';
  import { translate } from '#lib/translate/index.js';
  import Layout from '#lib/ui/layout/Layout.svelte';
  import HeaderFormSubmitButton from '#lib/ui/layout/HeaderFormSubmitButton.svelte';
  import Modal from '#lib/ui/Modal.svelte';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import SubScreen from '#lib/ui/layout/SubScreen.svelte';
  import CategoryIcons from '../../routes/categories/CategoryIcons.svelte';
  import { walletIcons } from './icons.js';

  export let creating = false;
  export let id: string | null = null;
  let draftId = uuid();
  let initializedId: string | null = null;
  let name = '';
  let ownerId = '';
  let icon: string | null = null;
  let iconSelecting = false;
  let busy = false;
  let deleteOpened = false;
  $: wallet = creating ? undefined : $walletsStore.find((item) => item.id === id);
  $: if (wallet && initializedId !== wallet.id) {
    // Keep the draft when the store updates the same wallet while the user is editing.
    // eslint-disable-next-line no-useless-assignment
    initializedId = wallet.id;
    name = wallet.name;
    icon = wallet.icon ?? null;
    ownerId = wallet.participantId ?? '';
    draftId = wallet.id;
  }
  $: returnPath =
    $page.url.searchParams.get('from') === 'settings'
      ? '/settings/wallets'
      : $page.url.searchParams.get('from') === 'list'
        ? '/wallets/list'
        : '/wallets';

  async function save(archived = wallet?.archived ?? false) {
    if (busy || !name.trim() || (!creating && !wallet)) return;
    busy = true;
    try {
      // Read the latest entity so an edit does not erase an update received from another device.
      const current = creating ? undefined : walletsService.getById(draftId);
      if (!creating && !current) throw new Error('Wallet is no longer available');
      await walletsService.save({
        ...current,
        id: draftId,
        name: name.trim(),
        icon: icon?.trim() || undefined,
        participantId: ownerId || undefined,
        archived,
      });
      const owner = participantsService.getById(ownerId);
      if (creating && owner && !owner.walletsOrder?.length) {
        await participantsService.save({
          ...owner,
          walletsOrder: [draftId, ...$walletsStore.filter((item) => item.id !== draftId).map((item) => item.id)],
        });
      }
      await finish(archived ? undefined : draftId);
    } catch {
      showErrorToast($translate('wallets.save_failed'));
    } finally {
      busy = false;
    }
  }
  async function finish(selected?: string) {
    await goto(returnPath === '/wallets' && selected ? `/wallets?wallet=${encodeURIComponent(selected)}` : returnPath, {
      replace: true,
    });
  }
  async function remove() {
    const current = walletsService.getById(draftId);
    if (busy || !current?.archived) return;
    busy = true;
    try {
      await walletsService.save({ ...current, deleted: true });
      deleteOpened = false;
      await finish();
    } catch {
      showErrorToast($translate('wallets.save_failed'));
    } finally {
      busy = false;
    }
  }
</script>

<Layout
  title={$translate(creating ? 'wallets.new' : 'wallets.edit_wallet')}
  onBack={() => goto(returnPath)}
  rightSlot={HeaderFormSubmitButton}
  hideMenu
>
  {#if creating || wallet}
    <form class="wallet-form flex-col gap-1" data-testId="WalletForm" on:submit|preventDefault={() => save()}>
      {#if wallet?.archived}<p class="hint">{$translate('accounts.archived')}</p>{/if}
      <Input label={$translate('wallets.name')} name="wallet-name" bind:value={name} required maxlength={100} />
      <button
        type="button"
        class="icon-picker"
        aria-label={$translate('icons.select_icon')}
        data-testId="WalletIconButton"
        on:click={() => (iconSelecting = true)}
      >
        <Icon name={icon || 'mdi:wallet-outline'} size={2} /><span>{$translate('icons.select_icon')}</span><Icon
          name="mdi:chevron-right"
        />
      </button>
      <label class="owner"
        >{$translate('wallets.owner')}
        <select name="wallet-owner" bind:value={ownerId}>
          <option value="">{$translate('wallets.shared')}</option>
          {#each $participantsStore as person (person.id)}<option value={person.id}>{person.name}</option>{/each}
          {#if ownerId && !$participantsStore.some((person) => person.id === ownerId)}<option value={ownerId}
              >{participantsService.deletedItems.find((person) => person.id === ownerId)?.name ?? '…'}</option
            >{/if}
        </select>
      </label>
      <Button type="submit" disabled={busy} text={$translate('common.save')} />
      {#if wallet}
        {#if wallet.archived}
          <Button
            bordered
            appearance="transparent"
            disabled={busy}
            text={$translate('wallets.restore')}
            onClick={() => save(false)}
          />
          <Button
            bordered
            appearance="transparent"
            color="danger"
            disabled={busy}
            text={$translate('common.delete')}
            onClick={() => (deleteOpened = true)}
          />
        {:else}
          <Button
            bordered
            appearance="transparent"
            color="secondary"
            disabled={busy}
            text={$translate('wallets.archive')}
            onClick={() => save(true)}
          />
        {/if}
      {:else}<Button
          bordered
          appearance="transparent"
          color="secondary"
          disabled={busy}
          text={$translate('common.cancel')}
          onClick={() => goto(returnPath)}
        />{/if}
    </form>
  {:else}
    <div class="wallet-form">
      <p>{$translate('wallets.not_found')}</p>
      <a href={returnPath}>{$translate('common.back')}</a>
    </div>
  {/if}
</Layout>
{#if iconSelecting}<SubScreen
    visible
    title={$translate('icons.select_icon')}
    onBack={() => (iconSelecting = false)}
    testId="WalletIconPicker"
  >
    <CategoryIcons
      icon={icon || 'mdi:wallet-outline'}
      icons={walletIcons}
      onSelect={(value) => {
        icon = value;
        iconSelecting = false;
      }}
    />
  </SubScreen>{/if}
<Modal bind:opened={deleteOpened} width={22} header={$translate('wallets.delete_confirm')}>
  <p>{$translate('wallets.delete_description')}</p>
  <div class="mt-1 grid-col-2 gap-1" data-testId="DeleteWalletConfirmation">
    <Button color="danger" disabled={busy} text={$translate('common.delete')} onClick={remove} />
    <Button
      bordered
      color="white"
      disabled={busy}
      text={$translate('common.cancel')}
      onClick={() => (deleteOpened = false)}
    />
  </div>
</Modal>

<style>
  .wallet-form {
    padding: 1rem;
    max-width: 30rem;
    margin: auto;
  }
  .icon-picker {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    font: inherit;
    background: var(--header-background-color);
    color: var(--primary-text-color);
    cursor: pointer;
  }
  .icon-picker span {
    flex: 1;
    text-align: left;
  }
  .owner {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  select {
    font: inherit;
    width: 100%;
    min-height: 2.75rem;
    padding: 0.6rem;
    border: 1px solid var(--border-color);
    border-radius: 0.65rem;
    color: var(--primary-text-color);
    background: var(--header-background-color);
  }
  .hint {
    color: var(--secondary-text-color);
    margin: 0;
  }
</style>
