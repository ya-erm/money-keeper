<script lang="ts">
  import { v4 as uuid } from 'uuid';

  import { accountsService } from '$lib/data';
  import type { Account } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import Icon from '$lib/ui/Icon.svelte';
  import Input from '$lib/ui/Input.svelte';
  import Modal from '$lib/ui/Modal.svelte';
  import { showErrorToast, showSuccessToast } from '$lib/ui/toasts';

  import DeleteAccountModal from './DeleteAccountModal.svelte';

  export let opened: boolean;
  export let account: Account | null = null;

  let name = account?.name ?? '';
  let icon = account?.icon;
  let currency = account?.currency ?? '';
  let order = `${account?.order ?? 0}`;

  const handleSave = async () => {
    accountsService.save({
      ...account,
      id: account?.id ?? uuid(),
      name,
      icon,
      currency,
      order: Number(order),
    });
    if (!account) {
      showSuccessToast($translate('accounts.create_account_success'), { testId: 'CreateAccountSuccessToast' });
    } else {
      showSuccessToast($translate('common.save_changes_success'), { testId: 'EditAccountSuccessToast' });
    }
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
</script>

<Modal width={20} header={account?.name ?? $translate('accounts.new_account')} bind:opened>
  <form class="flex-col gap-1" data-testId="AccountForm" on:submit|preventDefault={handleSave}>
    <Input label={$translate('accounts.name')} name="name" bind:value={name} required />
    <Input label={$translate('accounts.currency')} name="currency" bind:value={currency} required />
    <Input label={$translate('accounts.icon')} name="icon" bind:value={icon} optional>
      <a slot="end" href="https://icon-sets.iconify.design/" target="_blank" rel="noopener noreferrer">
        <Icon name="mdi:open-in-new" padding={0.5} />
      </a>
    </Input>
    <Input label={$translate('accounts.order')} name="order" bind:value={order} type="number" optional />
    <div class="grid-col-2 gap-1">
      {#if !!account}
        <Button color="danger" text={$translate('common.delete')} on:click={() => (deleteModalOpened = true)} />
      {:else}
        <Button color="secondary" text={$translate('common.cancel')} on:click={() => (opened = false)} />
      {/if}
      <Button text={$translate('common.save')} type="submit" />
    </div>
  </form>
</Modal>

<DeleteAccountModal bind:opened={deleteModalOpened} onDelete={handleDelete} />
