<script lang="ts">
  import type { AccountViewModel } from '$lib/data/interfaces';
  import Button from '@ya-erm/svelte-ui/Button';

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

  let showCorrectBalanceModal = false;
</script>

{#if !showCorrectBalanceModal}
  <Modal bind:opened header={$translate('common.additional_options')}>
    <div class="flex-col gap-1 select-none">
      <Button appearance="transparent" bordered onClick={handleEdit}>
        <span>{$translate('accounts.edit_account')}</span>
      </Button>
      <Button appearance="transparent" bordered onClick={() => (showCorrectBalanceModal = true)}>
        <span>{$translate('accounts.correct_balance')}</span>
      </Button>
      <Button color="white" bordered onClick={onClose}>
        <span>{$translate('common.cancel')}</span>
      </Button>
    </div>
  </Modal>
{:else}
  <CorrectBalanceModal bind:opened={showCorrectBalanceModal} {account} {balance} />
{/if}
