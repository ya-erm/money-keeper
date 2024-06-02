<script lang="ts">
  import { v4 as uuid } from 'uuid';

  import { accountTagsService, accountTagsStore, accountsService } from '$lib/data';
  import type { Account } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import Icon from '$lib/ui/Icon.svelte';
  import Input from '$lib/ui/Input.svelte';
  import InputLabel from '$lib/ui/InputLabel.svelte';
  import Modal from '$lib/ui/Modal.svelte';
  import { showErrorToast, showSuccessToast } from '$lib/ui/toasts';
  import TagsList from '$lib/widgets/TagsList.svelte';

  import DeleteAccountModal from './DeleteAccountModal.svelte';

  $: accountTags = $accountTagsStore;

  export let opened: boolean;
  export let account: Account | null = null;

  let name = account?.name ?? '';
  let icon = account?.icon;
  let color = account?.color;
  let currency = account?.currency ?? '';
  let selectedTags = account?.tagIds;
  let archived = account?.archived;

  const handleSave = async () => {
    accountsService.save({
      ...account,
      id: account?.id ?? uuid(),
      name,
      icon,
      color,
      currency,
      tagIds: selectedTags,
      archived,
    });
    opened = false;
  };

  let deleteModalOpened = false;

  const handleDelete = async () => {
    if (!account) return;
    try {
      accountsService.delete(account);
      showSuccessToast($translate('accounts.delete_account_success'));
      opened = false;
    } catch {
      showErrorToast($translate('accounts.delete_account_failure'));
    }
  };

  const handleArchive = async () => {
    archived = true;
    await handleSave();
  };

  const handleRestore = async () => {
    archived = false;
    await handleSave();
  };
</script>

<Modal width={20} bind:opened>
  <div slot="header" class="text-center mb-1">
    <div class="font-bold">{account?.name ?? $translate('accounts.new_account')}</div>
    <div class="subtitle" class:visibility-hidden={!archived}>{$translate('accounts.archived')}</div>
  </div>
  <form class="flex-col gap-1" data-testId="AccountForm" on:submit|preventDefault={handleSave}>
    <Input label={$translate('accounts.name')} name="name" bind:value={name} required />
    <Input label={$translate('accounts.currency')} name="currency" bind:value={currency} required />
    <Input label={$translate('accounts.icon')} name="icon" bind:value={icon} optional>
      <a slot="end" href="https://icon-sets.iconify.design/" target="_blank" rel="noopener noreferrer">
        <Icon name="mdi:open-in-new" padding={0.5} />
      </a>
    </Input>
    <Input label={$translate('accounts.color')} type="color" name="color" bind:value={color} optional />
    <div class="flex-col gap-0.5">
      <InputLabel text={$translate('accounts.tags')} optional />
      <TagsList
        bind:selectedTags
        tags={accountTags}
        onAdd={(t) => accountTagsService.save(t)}
        onEdit={(t) => accountTagsService.save(t)}
        onDelete={(t) => accountTagsService.delete(t)}
      />
    </div>
    <div class="grid-col-2 gap-1">
      {#if !!account}
        {#if archived}
          <Button
            bordered
            color="danger"
            appearance="transparent"
            text={$translate('common.delete')}
            on:click={() => (deleteModalOpened = true)}
          />
        {:else}
          <Button
            bordered
            color="secondary"
            appearance="transparent"
            text={$translate('accounts.archive')}
            on:click={handleArchive}
          />
        {/if}
      {:else}
        <Button
          bordered
          color="secondary"
          appearance="transparent"
          text={$translate('common.cancel')}
          on:click={() => (opened = false)}
        />
      {/if}
      {#if archived}
        <Button bordered text={$translate('accounts.restore')} on:click={handleRestore} />
      {:else}
        <Button bordered text={$translate('common.save')} type="submit" />
      {/if}
    </div>
  </form>
</Modal>

<DeleteAccountModal bind:opened={deleteModalOpened} onDelete={handleDelete} />

<style>
  .subtitle {
    font-size: 0.9rem;
    opacity: 0.5;
    height: 1rem;
    transition: height 0.5s;
    overflow: hidden;
  }
  .visibility-hidden {
    height: 0;
  }
</style>
