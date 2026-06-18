<script lang="ts">
  import { accountsService } from '$lib/data';
  import type { AccountViewModel } from '$lib/data/interfaces';
  import Button from '@ya-erm/svelte-ui/Button';
  import Icon from '@ya-erm/svelte-ui/Icon';

  import { translate } from '$lib/translate';
  import Modal from '$lib/ui/Modal.svelte';
  import CorrectBalanceModal from './CorrectBalanceModal.svelte';

  export let opened: boolean;
  export let account: AccountViewModel;
  export let balance: number | null = null;
  export let onEdit: ((account: AccountViewModel) => void) | undefined = undefined;

  const onClose = () => (opened = false);

  const handleEdit = () => {
    onEdit?.(account);
    onClose();
  };

  const handleToggleBalanceVisibility = () => {
    accountsService.save({
      id: account.id,
      name: account.name,
      currency: account.currency,
      icon: account.icon,
      color: account.color,
      tagIds: account.tagIds,
      deleted: account.deleted,
      archived: account.archived,
      hideBalance: !account.hideBalance,
    });
    onClose();
  };

  let showCorrectBalanceModal = false;
</script>

{#if !showCorrectBalanceModal}
  <Modal bind:opened width={16} header={$translate('common.additional_options')}>
    <div class="flex-col gap-1 select-none">
      <Button bordered color="white" onClick={handleEdit}>
        <span class="option-label">
          <Icon name="mdi:pencil" />
          <span>{$translate('common.edit')}</span>
        </span>
      </Button>
      <Button bordered color="white" onClick={handleToggleBalanceVisibility}>
        <span class="option-label">
          <Icon name={account.hideBalance ? 'mdi:eye-outline' : 'mdi:eye-off-outline'} />
          <span>{$translate(account.hideBalance ? 'accounts.show_balance' : 'accounts.hide_balance')}</span>
        </span>
      </Button>
      <Button bordered color="white" onClick={() => (showCorrectBalanceModal = true)}>
        <span class="option-label">
          <Icon name="mdi:auto-fix" />
          <span>{$translate('accounts.correct_balance')}</span>
        </span>
      </Button>
      <Button color="secondary" bordered onClick={onClose}>
        <span>{$translate('common.cancel')}</span>
      </Button>
    </div>
  </Modal>
{:else}
  <CorrectBalanceModal bind:opened={showCorrectBalanceModal} {account} {balance} />
{/if}

<style>
  .option-label {
    width: 100%;
    display: grid;
    grid-template-columns: 1.5rem 1fr;
    align-items: center;
    gap: 0.75rem;
    text-align: left;
  }
</style>
