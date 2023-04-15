<script lang="ts">
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import Modal from '$lib/ui/Modal.svelte';

  export let opened: boolean;
  export let onDelete: () => void;
</script>

<Modal width={22} header={$translate('accounts.delete_account_confirm')} bind:opened>
  <span>{$translate('accounts.delete_account_confirm_description')}</span>
  <div class="mt-1 grid-col-2 gap-1">
    <Button text={$translate('accounts.delete_account')} color="danger" on:click={onDelete} />
    <Button text={$translate('common.cancel')} color="white" bordered on:click={() => (opened = false)} />
  </div>
</Modal>
