<script lang="ts">
  import Button from '@ya-erm/svelte-ui/Button';

  import { translate } from '$lib/translate';
  import Modal from '$lib/ui/Modal.svelte';

  export let opened: boolean;
  export let onDelete: () => void;
</script>

<Modal width={22} header={$translate('accounts.delete_account_confirm')} bind:opened>
  <span>{$translate('accounts.delete_account_confirm_description')}</span>
  <div class="mt-1 grid-col-2 gap-1">
    <Button text={$translate('accounts.delete_account')} color="danger" onClick={onDelete} />
    <Button text={$translate('common.cancel')} color="white" bordered onClick={() => (opened = false)} />
  </div>
</Modal>
