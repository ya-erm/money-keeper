<script lang="ts">
  import type { AccountViewModel } from '$lib/data/interfaces';
  import Button from '@ya-erm/svelte-ui/Button';

  import { translate } from '$lib/translate';
  import Modal from '$lib/ui/Modal.svelte';
  import CorrectBalanceModal from './CorrectBalanceModal.svelte';

  export let opened: boolean;
  export let account: AccountViewModel;
  export let balance: number | null = null;

  const onClose = () => (opened = false);

  let showCorrectBalanceModal = false;
</script>

{#if !showCorrectBalanceModal}
  <Modal bind:opened header={$translate('common.additional_options')}>
    <div class="flex-col gap-1 select-none">
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
